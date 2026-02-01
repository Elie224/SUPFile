/**
 * Déclenche un téléchargement de blob sans modifier les enfants directs de document.body,
 * pour éviter le conflit "insertBefore" avec React (DOM et virtual DOM désynchronisés).
 * Le conteneur doit être créé au démarrage de l'app (main.jsx) pour ne jamais toucher
 * à body pendant un clic / pendant un commit React.
 */

const CONTAINER_ID = 'supfile-download-container';

export function ensureDownloadContainer() {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none;';
    document.body.appendChild(el);
  }
  return el;
}

function getDownloadContainer() {
  let el = typeof document !== 'undefined' ? document.getElementById(CONTAINER_ID) : null;
  if (!el) el = ensureDownloadContainer();
  return el;
}

/**
 * Déclenche le téléchargement d'un Blob avec le nom de fichier donné.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  if (!blob || !(blob instanceof Blob)) return;
  const container = getDownloadContainer();
  if (!container) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  try {
    container.appendChild(a);
    a.click();
  } finally {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
        if (a.parentNode === container) container.removeChild(a);
      } catch (_) {}
    }, 150);
  }
}
