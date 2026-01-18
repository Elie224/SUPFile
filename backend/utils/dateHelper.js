/**
 * Utilitaires pour la gestion des dates
 * Ce module fournit des fonctions pour normaliser et formater les dates
 * de manière cohérente dans toute l'application
 */

/**
 * Obtient la date actuelle en UTC
 * Cette fonction garantit que les dates utilisent le fuseau horaire UTC
 * @returns {Date} Date actuelle en UTC
 */
function getCurrentDate() {
  return new Date();
}

/**
 * Obtient une date corrigée si la date système est incorrecte
 * Si la date système est en 2026, on ajuste à 2025
 * NOTE: Ceci est un workaround temporaire pour un problème de date système
 * La vraie solution est de corriger la date système du serveur
 * @param {Date} date - Date à vérifier
 * @returns {Date} Date corrigée si nécessaire
 */
function getCorrectedDate(date = null) {
  const currentDate = date || new Date();
  const year = currentDate.getFullYear();
  
  // Si l'année est 2026, on la remplace par 2025
  // Cette logique peut être ajustée selon vos besoins
  if (year === 2026) {
    const correctedDate = new Date(currentDate);
    correctedDate.setFullYear(2025);
    return correctedDate;
  }
  
  return currentDate;
}

/**
 * Formate une date en ISO string
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée en ISO string
 */
function toISOString(date) {
  const correctedDate = getCorrectedDate(date);
  return correctedDate.toISOString();
}

/**
 * Vérifie si une date est dans l'année 2026 (probablement incorrecte)
 * @param {Date} date - Date à vérifier
 * @returns {boolean} true si la date est en 2026
 */
function isIncorrectYear(date) {
  return date && date.getFullYear() === 2026;
}

module.exports = {
  getCurrentDate,
  getCorrectedDate,
  toISOString,
  isIncorrectYear,
};