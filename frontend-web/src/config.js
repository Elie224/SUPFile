// Logo de l'application (importé pour être inclus dans le build et affiché partout)
import logoImg from './assets/logo.png';

// Configuration de l'API (une seule source pour éviter d'appeler un mauvais backend)
// En production : définir VITE_API_URL au build (ex. Netlify/Render) pour pointer vers le backend (ex. https://supfile.fly.dev)
export const API_URL = import.meta.env.VITE_API_URL || 'https://supfile.fly.dev';
// Superadmin (protégé contre suppression/modification par les autres admins)
export const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'kouroumaelisee@gmail.com').trim().toLowerCase();
export const LOGO_IMG = logoImg;


