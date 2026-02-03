#!/usr/bin/env python
"""Scan git history for common secret patterns without printing the secrets.

It inspects blobs across all refs and reports *paths* + *pattern category* +
content hash of the match (so you can confirm remediation) without leaking values.

Usage:
  python tools/scan_git_history_secrets.py

Exit code:
  0 if no findings
  2 if findings
"""

from __future__ import annotations

import hashlib
import os
import re
import subprocess
import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class Finding:
    category: str
    path: str
    obj: str
    match_hash: str


PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("mongodb_uri", re.compile(r"mongodb(?:\+srv)?://[^\s'\"]+", re.IGNORECASE)),
    ("jwt_like", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    ("github_token", re.compile(r"\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b")),
    ("github_pat", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b")),
    ("google_api_key", re.compile(r"\bAIza[0-9A-Za-z_-]{20,}\b")),
    ("google_oauth_token", re.compile(r"\bya29\.[0-9A-Za-z_-]+\b")),
    ("slack_token", re.compile(r"\bxox[baprs]-[0-9A-Za-z-]{10,}\b")),
    ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----")),
    ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("aws_secret_key", re.compile(r"\baws_secret_access_key\b\s*[:=]\s*[^\s'\"]{20,}", re.IGNORECASE)),
    ("env_secret_assignment", re.compile(
        r"\b(JWT_SECRET|JWT_REFRESH_SECRET|SESSION_SECRET|MONGO_URI|DB_URI|SMTP_PASS|GITHUB_CLIENT_SECRET|GOOGLE_CLIENT_SECRET)\b\s*[:=]\s*([^\s'\"]{8,})",
        re.IGNORECASE,
    )),
]

# Values that look like placeholders rather than secrets
PLACEHOLDER_HINTS = (
    "change_me",
    "changeme",
    "your_",
    "votre",
    "<",
    "[",
    "example",
    "localhost",
    "dev_",
    "test_",
)


def run_git(args: list[str]) -> str:
    return subprocess.check_output(["git", *args], text=True, stderr=subprocess.DEVNULL)


def iter_blobs() -> list[tuple[str, str]]:
    """Return list of (blob_sha, path) across all refs."""
    out = run_git(["rev-list", "--objects", "--all"])
    blobs: list[tuple[str, str]] = []
    for line in out.splitlines():
        if not line.strip():
            continue
        parts = line.split(" ", 1)
        obj = parts[0]
        path = parts[1] if len(parts) > 1 else ""
        blobs.append((obj, path))
    return blobs


def cat_blob(obj: str) -> bytes:
    return subprocess.check_output(["git", "cat-file", "-p", obj], stderr=subprocess.DEVNULL)


def is_likely_binary(data: bytes) -> bool:
    if b"\x00" in data[:4096]:
        return True
    return False


def hash_match(m: str) -> str:
    return hashlib.sha256(m.encode("utf-8", errors="ignore")).hexdigest()[:12]


def looks_placeholder(value: str) -> bool:
    low = value.strip().lower()
    return any(h in low for h in PLACEHOLDER_HINTS)


def main() -> int:
    try:
        _ = run_git(["rev-parse", "--is-inside-work-tree"]).strip()
    except Exception:
        print("Not a git repository.")
        return 1

    findings: dict[tuple[str, str, str], Finding] = {}

    blobs = iter_blobs()
    for obj, path in blobs:
        try:
            size_str = run_git(["cat-file", "-s", obj]).strip()
            size = int(size_str)
        except Exception:
            continue

        # Skip huge blobs (avoid spending too much time / memory)
        if size > 2_000_000:
            continue

        try:
            data = cat_blob(obj)
        except Exception:
            continue

        if is_likely_binary(data):
            continue

        try:
            text = data.decode("utf-8", errors="ignore")
        except Exception:
            continue

        for category, regex in PATTERNS:
            for match in regex.finditer(text):
                matched = match.group(0)

                # For env assignment pattern, try to ignore obvious placeholders
                if category == "env_secret_assignment":
                    try:
                        value = match.group(2)
                    except Exception:
                        value = matched
                    if looks_placeholder(value):
                        continue

                # For mongodb uri, ignore localhost and obvious templates
                if category == "mongodb_uri" and looks_placeholder(matched):
                    continue

                key = (category, path, obj)
                if key not in findings:
                    findings[key] = Finding(
                        category=category,
                        path=path or "<no-path>",
                        obj=obj,
                        match_hash=hash_match(matched),
                    )

                # Don't spam: one finding per category/path/blob is enough
                break

    if not findings:
        print("[scan] No suspicious patterns found in git history.")
        return 0

    # Print a safe report (no secrets)
    print(f"[scan] Findings: {len(findings)}")
    by_cat: dict[str, int] = {}
    for f in findings.values():
        by_cat[f.category] = by_cat.get(f.category, 0) + 1

    for cat in sorted(by_cat.keys()):
        print(f"  - {cat}: {by_cat[cat]}")

    print("\n[scan] Sample (first 50):")
    for f in list(findings.values())[:50]:
        print(f"  {f.category}\t{f.path}\t{f.obj[:12]}\t{f.match_hash}")

    print("\n[scan] Action: remove/rotate any real secrets and rewrite history if needed.")
    return 2


if __name__ == "__main__":
    sys.exit(main())
