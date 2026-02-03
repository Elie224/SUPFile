const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');
const BlockedEmailModel = require('../models/blockedEmailModel');
const { AppError } = require('../middlewares/errorHandler');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/mailer');
const config = require('../config');
const { normalizeHexToken64, normalizeEmailForLookup } = require('../utils/authTokenSecurity');

const SALT_ROUNDS = 10;

async function signup(req, res, next) {
  try {
    // Vérifier que MongoDB est connecté
    const mongoose = require('../models/db');
    const db = mongoose.connection;
    
    // Attendre la connexion si elle n'est pas encore établie
    if (db.readyState !== 1) {
      // Si en cours de connexion, attendre un peu
      if (db.readyState === 2) {
        await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(), 2000);
          db.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }
      
      // Vérifier à nouveau
      if (db.readyState !== 1) {
        return res.status(503).json({ 
          error: { 
            message: 'Connexion à la base de données impossible. Veuillez réessayer dans un instant.' 
          } 
        });
      }
    }

    const body = req.validatedBody || req.body;
    const { email, password, first_name, last_name, country } = body;

    // Vérifier si l'email est bloqué (suppression définitive par un admin)
    const isBlocked = await BlockedEmailModel.isBlocked(email);
    if (isBlocked) {
      return res.status(403).json({
        error: {
          message: 'Cette adresse email a été bloquée. Vous ne pouvez pas créer de compte avec cette adresse.'
        }
      });
    }

    // Check existing user
    let existing;
    try {
      existing = await User.findByEmail(email);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error checking existing user:', err);
      }
      if (err.message && err.message.includes('MongoDB')) {
        return res.status(503).json({ 
          error: { 
            message: 'Connexion à la base de données indisponible. Veuillez réessayer dans un instant.' 
          } 
        });
      }
      throw err;
    }
    
    if (existing) {
      return res.status(409).json({ error: { message: 'Cette adresse e-mail est déjà utilisée.' } });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const displayName = [first_name, last_name].filter(Boolean).map(s => s.trim()).join(' ').trim() || null;
    let created;
    try {
      created = await User.create({
        email,
        passwordHash,
        display_name: displayName,
        first_name: first_name?.trim() || null,
        last_name: last_name?.trim() || null,
        country: country?.trim() || null,
        email_verified: false,
      });
    } catch (err) {
      console.error('Error creating user:', err);
      if (err.message && err.message.includes('MongoDB')) {
        return res.status(503).json({ 
          error: { 
            message: 'Connexion à la base de données indisponible. Veuillez réessayer dans un instant.' 
          } 
        });
      }
      throw err;
    }

    // Générer le token de vérification et envoyer l'email
    const tokenData = await User.generateEmailVerificationToken(email);
    if (tokenData) {
      const frontendUrl = (process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
      const verifyUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(tokenData.token)}`;
      await sendVerificationEmail(email, verifyUrl, first_name || undefined);
    }

    // Créer le dossier racine pour l'utilisateur
    const FolderModel = require('../models/folderModel');
    try {
      await FolderModel.create({ name: 'Racine', ownerId: created.id, parentId: null });
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to create root folder for user:', e.message || e);
      }
    }

    // Ne pas renvoyer de tokens : l'utilisateur doit d'abord vérifier son email
    res.status(201).json({
      data: { email: created.email },
      message: 'Compte créé. Veuillez vérifier votre boîte e-mail et cliquer sur le lien de vérification avant de vous connecter.',
    });
  } catch (err) {
    console.error('Signup error:', err);
    // Si c'est une erreur MongoDB de connexion
    if (err.message && err.message.includes('MongoDB is not connected')) {
      return res.status(503).json({ 
        error: { 
          message: 'Connexion à la base de données indisponible. Veuillez réessayer dans un instant.' 
        } 
      });
    }
    // Si c'est une erreur de validation Mongoose (email déjà utilisé)
    if (err.name === 'MongoServerError' && err.code === 11000) {
      return res.status(409).json({
        error: {
          message: 'Cet email est déjà utilisé. Si vous n\'avez pas vérifié votre compte, allez sur la page de connexion pour renvoyer l\'email de vérification.',
          code: 'EMAIL_ALREADY_EXISTS',
        },
      });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    // Vérifier que MongoDB est connecté
    const mongoose = require('../models/db');
    const db = mongoose.connection;
    
    // Attendre la connexion si elle n'est pas encore établie
    if (db.readyState !== 1) {
      // Si en cours de connexion, attendre un peu
      if (db.readyState === 2) {
        await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(), 2000);
          db.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }
      
      // Vérifier à nouveau
      if (db.readyState !== 1) {
        return res.status(503).json({ 
          error: { 
            message: 'Connexion à la base de données impossible. Veuillez réessayer dans un instant.' 
          } 
        });
      }
    }

    const body = req.validatedBody || req.body;
    const { email, password } = body;

    // Vérifier si l'email est bloqué (supprimé définitivement par un admin)
    const isBlocked = await BlockedEmailModel.isBlocked(email);
    if (isBlocked) {
      return res.status(403).json({
        error: {
          message: 'Vous ne pouvez pas vous connecter. Cette adresse a été bloquée par notre système.'
        }
      });
    }

    const user = await User.findByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: { message: 'Identifiants incorrects.' } });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: {
          message: 'E-mail non vérifié. Veuillez vérifier votre boîte de réception et cliquer sur le lien de vérification avant de vous connecter.',
          code: 'EMAIL_NOT_VERIFIED',
        },
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: { message: 'Identifiants incorrects.' } });
    }

    // Vérifier si le 2FA est activé
    if (user.two_factor_enabled) {
      // Ne pas générer de tokens, demander le code 2FA
      return res.status(200).json({ 
        data: { 
          requires_2fa: true,
          user_id: user.id,
          email: user.email
        }, 
        message: 'Code 2FA requis' 
      });
    }

    // Mettre à jour last_login_at AVANT de récupérer les données utilisateur
    await User.updateLastLogin(user.id);

    const payload = { id: user.id, email: user.email };
    const access_token = generateAccessToken(payload);
    const refresh_token = generateRefreshToken(payload);

    // Persist session
    try {
      const userAgent = req.get('user-agent') || null;
      const ip = req.ip || req.headers['x-forwarded-for'] || null;
      await Session.createSession({ userId: user.id, refreshToken: refresh_token, userAgent, ipAddress: ip, deviceName: null, expiresIn: config.jwt.refreshExpiresIn });
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to create session on login:', e.message || e);
      }
    }

    // Récupérer les données utilisateur mises à jour (avec last_login_at)
    const updatedUser = await User.findById(user.id);

    // Remove sensitive fields before returning
    const safeUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      display_name: updatedUser.display_name,
      avatar_url: updatedUser.avatar_url,
      quota_used: updatedUser.quota_used,
      quota_limit: updatedUser.quota_limit,
      preferences: updatedUser.preferences,
      is_admin: updatedUser.is_admin || false,
      created_at: updatedUser.created_at,
      last_login_at: updatedUser.last_login_at || new Date(), // Utiliser la date mise à jour
    };

    res.status(200).json({ data: { user: safeUser, access_token, refresh_token }, message: 'Connexion réussie.' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Login error:', err);
    }
    if (err.message && err.message.includes('MongoDB is not connected')) {
      return res.status(503).json({ 
        error: { 
          message: 'Connexion à la base de données indisponible. Veuillez réessayer dans un instant.' 
        } 
      });
    }
    next(err);
  }
}

async function verify2FALogin(req, res, next) {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: { message: 'ID utilisateur et code 2FA requis' } });
    }

    const user = await User.findById(userId);
    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({ error: { message: 'Utilisateur non trouvé ou 2FA non activé' } });
    }

    // Vérifier le code 2FA
    const speakeasy = require('speakeasy');
    
    // Vérifier si c'est un code de secours
    const isBackupCode = user.two_factor_backup_codes && user.two_factor_backup_codes.includes(token);
    
    let verified = false;
    if (isBackupCode) {
      // Utiliser le code de secours
      verified = await User.useBackupCode(userId, token);
    } else {
      // Vérifier le token TOTP
      verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: token,
        window: 2
      });
    }

    if (!verified) {
      return res.status(401).json({ error: { message: 'Code 2FA invalide' } });
    }

    // Code valide, générer les tokens
    await User.updateLastLogin(user.id);

    const payload = { id: user.id, email: user.email };
    const access_token = generateAccessToken(payload);
    const refresh_token = generateRefreshToken(payload);

    // Persist session
    try {
      const userAgent = req.get('user-agent') || null;
      const ip = req.ip || req.headers['x-forwarded-for'] || null;
      await Session.createSession({ userId: user.id, refreshToken: refresh_token, userAgent, ipAddress: ip, deviceName: null, expiresIn: config.jwt.refreshExpiresIn });
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to create session on 2FA login:', e.message || e);
      }
    }

    // Récupérer les données utilisateur mises à jour
    const updatedUser = await User.findById(user.id);

    const safeUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      display_name: updatedUser.display_name,
      avatar_url: updatedUser.avatar_url,
      quota_used: updatedUser.quota_used,
      quota_limit: updatedUser.quota_limit,
      preferences: updatedUser.preferences,
      is_admin: updatedUser.is_admin || false,
      two_factor_enabled: updatedUser.two_factor_enabled,
      created_at: updatedUser.created_at,
      last_login_at: updatedUser.last_login_at || new Date(),
    };

    res.status(200).json({ 
      data: { user: safeUser, access_token, refresh_token }, 
      message: 'Connexion 2FA réussie' 
    });
  } catch (err) {
    console.error('2FA login error:', err);
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: { message: 'Le jeton de rafraîchissement est requis.' } });
    }

    // Vérifier le refresh token
    let decoded;
    try {
      decoded = verifyToken(refresh_token, true);
    } catch (err) {
      return res.status(401).json({ error: { message: 'Jeton de rafraîchissement invalide ou expiré.' } });
    }

    // Vérifier que la session existe et n'est pas révoquée
    const session = await Session.findByToken(refresh_token);
    if (!session || session.is_revoked) {
      return res.status(401).json({ error: { message: 'Jeton de rafraîchissement invalide ou expiré.', code: 'SESSION_INVALID' } });
    }

    // Vérifier que l'utilisateur existe encore (n'a pas été supprimé)
    const existingUser = await User.findById(decoded.id);
    if (!existingUser) {
      const userEmail = decoded.email || '';
      const isBlocked = await BlockedEmailModel.isBlocked(userEmail);
      const message = isBlocked
        ? 'Vous ne pouvez pas vous connecter. Cette adresse a été bloquée par notre système.'
        : 'Veuillez vous inscrire et vous connecter pour accéder à Supfile, votre espace de stockage.';
      return res.status(401).json({
        error: { message, code: 'USER_DELETED', email_blocked: isBlocked }
      });
    }

    // Générer de nouveaux tokens
    const payload = { id: decoded.id, email: decoded.email };
    const new_access_token = generateAccessToken(payload);
    const new_refresh_token = generateRefreshToken(payload);

    // Mettre à jour la session avec le nouveau refresh token
    await Session.rotateToken(refresh_token, new_refresh_token, config.jwt.refreshExpiresIn);

    res.status(200).json({ 
      data: { 
        access_token: new_access_token, 
        refresh_token: new_refresh_token 
      }, 
      message: 'Jeton rafraîchi avec succès.'
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Refresh error:', err);
    }
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      await Session.revokeByToken(refresh_token);
    }

    res.status(200).json({ message: 'Déconnexion réussie.' });
  } catch (err) {
    console.error('Logout error:', err);
    next(err);
  }
}

/**
 * Demande de réinitialisation de mot de passe
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const email = normalizeEmailForLookup(req.body?.email);

    if (!email) {
      return res.status(400).json({ 
        error: { message: 'L\'adresse email est requise' } 
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findByEmail(email);
    
    // On retourne toujours un succès pour ne pas révéler si l'email existe
    if (!user) {
      return res.status(200).json({ 
        message: 'Si cette adresse email est associée à un compte, vous recevrez un lien de réinitialisation.' 
      });
    }

    // Vérifier que l'utilisateur a un mot de passe (pas OAuth uniquement)
    if (!user.password_hash) {
      return res.status(200).json({ 
        message: 'Si cette adresse email est associée à un compte, vous recevrez un lien de réinitialisation.' 
      });
    }

    // Générer le token de réinitialisation
    const resetData = await User.generateResetToken(email);
    
    if (!resetData) {
      return res.status(200).json({ 
        message: 'Si cette adresse email est associée à un compte, vous recevrez un lien de réinitialisation.' 
      });
    }

    // Construire l'URL de réinitialisation (frontend uniquement, sans trailing slash)
    const frontendUrl = (process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetData.token)}`;

    // Envoyer l'email
    const emailSent = await sendPasswordResetEmail(email, resetUrl);

    if (!emailSent && process.env.NODE_ENV !== 'production') {
      console.error('Failed to send reset email');
    }

    res.status(200).json({ 
      message: 'Si cette adresse email est associée à un compte, vous recevrez un lien de réinitialisation.' 
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    next(err);
  }
}

/**
 * Vérifie si un token de réinitialisation est valide
 * GET /api/auth/verify-reset-token/:token
 */
async function verifyResetToken(req, res, next) {
  try {
    const token = normalizeHexToken64(req.params?.token);

    if (!token) {
      return res.status(400).json({ 
        error: { message: 'Token manquant' } 
      });
    }

    const user = await User.verifyResetToken(token);

    if (!user) {
      return res.status(400).json({ 
        error: { message: 'Ce lien a expiré (15 minutes) ou est invalide. Refaites une demande de réinitialisation.' } 
      });
    }

    res.status(200).json({ 
      data: { valid: true, email: user.email },
      message: 'Token valide' 
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Verify reset token error:', err);
    }
    next(err);
  }
}

/**
 * Réinitialise le mot de passe avec un token valide
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ 
        error: { message: 'Token et nouveau mot de passe requis' } 
      });
    }

    const normalizedToken = normalizeHexToken64(token);
    if (!normalizedToken) {
      return res.status(400).json({ 
        error: { message: 'Ce lien a expiré (15 minutes) ou est invalide. Refaites une demande de réinitialisation.' } 
      });
    }

    if (typeof password !== 'string') {
      return res.status(400).json({ 
        error: { message: 'Le mot de passe doit être une chaîne de caractères' } 
      });
    }

    if (password.length > 128) {
      return res.status(400).json({ 
        error: { message: 'Le mot de passe ne doit pas dépasser 128 caractères' } 
      });
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return res.status(400).json({ 
        error: { message: 'Le mot de passe doit contenir au moins 8 caractères' } 
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ 
        error: { message: 'Le mot de passe doit contenir au moins une majuscule' } 
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ 
        error: { message: 'Le mot de passe doit contenir au moins un chiffre' } 
      });
    }

    // Vérifier le token
    const user = await User.verifyResetToken(normalizedToken);
    
    if (!user) {
      return res.status(400).json({ 
        error: { message: 'Ce lien a expiré (15 minutes) ou est invalide. Refaites une demande de réinitialisation.' } 
      });
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Mettre à jour le mot de passe
    const success = await User.resetPassword(normalizedToken, passwordHash);

    if (!success) {
      return res.status(400).json({ 
        error: { message: 'Erreur lors de la réinitialisation du mot de passe' } 
      });
    }

    // Révoquer toutes les sessions de l'utilisateur
    try {
      await Session.revokeAllByUserId(user.id);
    } catch (e) {
      console.error('Failed to revoke sessions after password reset:', e.message);
    }

    res.status(200).json({ 
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' 
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Reset password error:', err);
    }
    next(err);
  }
}

/**
 * Vérifie l'email via le token reçu par email
 * GET /api/auth/verify-email?token=xxx ou POST /api/auth/verify-email { token }
 */
async function verifyEmail(req, res, next) {
  try {
    const rawToken = req.query.token || req.body?.token;
    const token = normalizeHexToken64(rawToken);
    if (!token) {
      return res.status(400).json({ error: { message: 'Token manquant' } });
    }

    const user = await User.verifyEmailToken(token);
    if (!user) {
      return res.status(400).json({
        error: { message: 'Lien expiré ou invalide. Demandez un nouvel email de vérification depuis la page de connexion.' },
      });
    }

    res.status(200).json({
      data: { email: user.email },
      message: 'Email vérifié. Vous pouvez maintenant vous connecter.',
    });
  } catch (err) {
    console.error('Verify email error:', err);
    next(err);
  }
}

/**
 * Renvoyer l'email de vérification
 * POST /api/auth/resend-verification { email }
 */
async function resendVerification(req, res, next) {
  try {
    const email = normalizeEmailForLookup(req.body?.email);
    if (!email) {
      return res.status(400).json({ error: { message: 'Email requis' } });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(200).json({ message: 'Si ce compte existe, un nouvel email de vérification a été envoyé.' });
    }
    if (user.email_verified) {
      return res.status(200).json({ message: 'Cet email est déjà vérifié. Vous pouvez vous connecter.' });
    }

    const tokenData = await User.generateEmailVerificationToken(email);
    if (tokenData) {
      const frontendUrl = (process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
      const verifyUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(tokenData.token)}`;
      await sendVerificationEmail(email, verifyUrl, user.first_name || undefined);
    }

    res.status(200).json({ message: 'Si ce compte existe, un nouvel email de vérification a été envoyé.' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Resend verification error:', err);
    }
    next(err);
  }
}

module.exports = {
  signup,
  login,
  verify2FALogin,
  refresh,
  logout,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail,
  resendVerification,
};

