// Logo de l'application (importé pour être inclus dans le build et affiché partout)
import logoImg from './assets/logo.png';

// Configuration de l'API
// En production, cette valeur sera remplacée par VITE_API_URL si définie
export const API_URL = import.meta.env.VITE_API_URL || 'https://supfile.fly.dev';
export const LOGO_IMG = logoImg;


