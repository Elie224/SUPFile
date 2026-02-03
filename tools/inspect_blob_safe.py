#!/usr/bin/env python
"""Inspect a git blob for secret-like lines WITHOUT printing secret values.

Usage:
  python tools/inspect_blob_safe.py <blob_sha> [<blob_sha>...]

Prints: blob id, key name, flags (template/redacted), and value length + sha256 prefix.
"""

from __future__ import annotations

import hashlib
import re
import subprocess
import sys

KEYS_RE = re.compile(
    r"\b(JWT_SECRET|JWT_REFRESH_SECRET|SESSION_SECRET|SMTP_PASS|GITHUB_CLIENT_SECRET|GOOGLE_CLIENT_SECRET|MONGO_URI|DB_URI)\b",
    re.IGNORECASE,
)
MONGO_URI_RE = re.compile(r"mongodb(?:\+srv)?://[^\s'\"]+", re.IGNORECASE)


def _safe_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8", errors="ignore")).hexdigest()[:12]


def _git_cat_blob(obj: str) -> str:
    return subprocess.check_output(["git", "cat-file", "-p", obj], text=True, stderr=subprocess.DEVNULL)


def main(argv: list[str]) -> int:
    objs = [a.strip() for a in argv[1:] if a.strip()]
    if not objs:
        print("Usage: python tools/inspect_blob_safe.py <blob_sha> [<blob_sha>...]")
        return 2

    for obj in objs:
        try:
            text = _git_cat_blob(obj)
        except Exception:
            print(f"{obj}\t<missing>")
            continue

        matched = 0
        for line in text.splitlines():
            if not (KEYS_RE.search(line) or MONGO_URI_RE.search(line)):
                continue

            matched += 1
            # Get a best-effort 'value' (after : or =)
            m = re.search(r"[:=]\s*(.+)$", line)
            raw_val = (m.group(1).strip() if m else "")
            val = raw_val.strip('"\'')

            flags: list[str] = []
            if "${" in val or "$(" in val:
                flags.append("tmpl")
            if "REDACTED" in val.upper() or "[REDACTED]" in val.upper():
                flags.append("redacted")
            if MONGO_URI_RE.search(line):
                flags.append("mongo_uri")
            if KEYS_RE.search(line):
                flags.append("key")

            if val:
                flags.append(f"len={len(val)}")
                flags.append(f"hash={_safe_hash(val)}")
            else:
                flags.append("no_val")

            left = line.split(":", 1)[0].split("=", 1)[0].strip()
            print(f"{obj}\t{left}\t{' '.join(flags)}")

        if matched == 0:
            print(f"{obj}\t<no matches>")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
