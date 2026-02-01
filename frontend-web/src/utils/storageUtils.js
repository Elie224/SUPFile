/**
 * Système de calcul du stockage : une seule source de vérité pour toute l'application.
 * Utilisé par Dashboard, Settings, StorageChart, Admin, et partout où on affiche quota / taille.
 */

/** Quota par défaut en octets (30 Go) */
export const DEFAULT_QUOTA_LIMIT_BYTES = 30 * 1024 * 1024 * 1024;

const K = 1024;
const SIZES = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

/**
 * Formate une taille en octets en chaîne lisible (Bytes, KB, MB, GB, TB).
 * @param {number} bytes - Taille en octets
 * @returns {string} ex. "1.5 MB", "0 Bytes"
 */
export function formatBytes(bytes) {
  const n = Number(bytes);
  if (n === 0 || !Number.isFinite(n)) return '0 Bytes';
  const i = Math.min(Math.floor(Math.log(Math.abs(n)) / Math.log(K)), SIZES.length - 1);
  const value = Math.round((n / Math.pow(K, i)) * 100) / 100;
  return value + ' ' + SIZES[i];
}

/**
 * Formate un pourcentage pour l'affichage (évite "0.00%" pour les très petits %).
 * Règles : 0 → "0" ; < 0.0001 → "< 0.01" ; < 0.01 → 4 décimales ; < 1 → 2 décimales ; sinon entier.
 * @param {number} raw - Pourcentage brut (0–100)
 * @returns {string} sans le symbole % (à ajouter côté appelant si besoin)
 */
export function formatPercentage(raw) {
  const p = Number(raw);
  if (p === 0 || !Number.isFinite(p)) return '0';
  if (p < 0.0001) return '< 0.01';
  if (p < 0.01) return String(Number(p.toFixed(4)));
  if (p < 1) return String(Number(p.toFixed(2)));
  return String(Math.round(p));
}

/**
 * Formate un pourcentage pour affichage avec le symbole % (ex. pour donut / légende).
 * @param {number} raw - Pourcentage brut (0–100)
 * @returns {string} ex. "0.0033%", "< 0.01%", "100%"
 */
export function formatPercentageWithSymbol(raw) {
  const p = Number(raw);
  if (p === 0 || !Number.isFinite(p)) return '0%';
  if (p < 0.0001) return '< 0.01%';
  if (p < 0.01) return p.toFixed(4) + '%';
  if (p < 1) return p.toFixed(2) + '%';
  if (p < 100) return p.toFixed(1) + '%';
  return '100%';
}

/**
 * Calcule le pourcentage d'utilisation (used / limit * 100), plafonné à 100.
 * @param {number} usedBytes - Octets utilisés
 * @param {number} limitBytes - Quota en octets
 * @returns {number} 0–100
 */
export function computePercentageRaw(usedBytes, limitBytes) {
  const used = Number(usedBytes) || 0;
  const limit = Number(limitBytes) || DEFAULT_QUOTA_LIMIT_BYTES;
  if (limit <= 0 || used < 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

/**
 * Largeur de barre de progression en % : minimum 0.1% si utilisé > 0 pour visibilité.
 * @param {number} percentageRaw - Pourcentage brut (0–100)
 * @param {number} usedBytes - Octets utilisés (optionnel, pour savoir si > 0)
 * @returns {number} 0–100
 */
export function getBarWidth(percentageRaw, usedBytes = null) {
  const p = Number(percentageRaw);
  if (p <= 0 && (usedBytes == null || Number(usedBytes) <= 0)) return 0;
  if (p > 0) return Math.max(p, 0.1);
  return 0.1;
}

/**
 * Couleur de la barre selon le pourcentage : success (< 75), warning (75–80), danger (> 80).
 * @param {number} percentageRaw - Pourcentage brut (0–100)
 * @returns {'success'|'warning'|'danger'}
 */
export function getBarColor(percentageRaw) {
  const p = Number(percentageRaw);
  if (p > 80) return 'danger';
  if (p > 75) return 'warning';
  return 'success';
}

/**
 * Objet complet pour afficher le stockage (barre + texte).
 * @param {number} usedBytes - Octets utilisés
 * @param {number} limitBytes - Quota en octets
 * @returns {{ raw: number, display: string, barWidth: number, color: 'success'|'warning'|'danger', displayText: string, usedBytes: number, limitBytes: number }}
 */
export function computeStorage(usedBytes, limitBytes) {
  const used = Number(usedBytes) || 0;
  const limit = Number(limitBytes) || DEFAULT_QUOTA_LIMIT_BYTES;
  const raw = computePercentageRaw(used, limit);
  const display = formatPercentage(raw);
  const barWidth = getBarWidth(raw, used);
  const color = getBarColor(raw);
  const displayText = `${display}%`;
  return {
    raw,
    display,
    barWidth,
    color,
    displayText,
    usedBytes: used,
    limitBytes: limit,
  };
}

/**
 * Pourcentage d'un élément dans un total (ex. répartition par type).
 * @param {number} value - Valeur de l'élément (octets)
 * @param {number} total - Total (octets)
 * @returns {number} 0–100
 */
export function computePartPercentage(value, total) {
  const v = Number(value) || 0;
  const t = Number(total) || 0;
  if (t <= 0 || v < 0) return 0;
  return Math.min(100, (v / t) * 100);
}
