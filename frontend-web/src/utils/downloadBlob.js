/**
 * Déclenche un téléchargement de blob sans modifier les enfants directs de document.body,
 * pour éviter le conflit "insertBefore" avec React (DOM et virtual DOM désynchronisés).
 * Utilise un conteneur dédié pour le lien temporaire.
 */

const CONTAINER_ID = 'supfile-download-container';

function getDownloadContainer() {
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

/**
 * Déclenche le téléchargement d'un Blob avec le nom de fichier donné.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  if (!blob || !(blob instanceof Blob)) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  const container = getDownloadContainer();
  container.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
      if (a.parentNode === container) container.removeChild(a);
    } catch (_) {}
  }, 100);
}
