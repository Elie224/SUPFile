const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');
const { AppError } = require('../middlewares/errorHandler');
const { sendPasswordResetEmail } = require('../utils/mailer');
const config = require('../config');

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
    const { email, password } = body;

    // Check existing user
    let existing;
    try {
      existing = await User.findByEmail(email);
    } catch (err) {
      console.error('Error checking existing user:', err);
      if (err.message && err.message.includes('MongoDB')) {
        return res.status(503).json({ 
          error: { 
            message: 'Database connection not available. Please try again in a moment.' 
          } 
        });
      }
      throw err;
    }
    
    if (existing) {
      return res.status(409).json({ error: { message: 'Email already in use' } });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    let created;
    try {
      created = await User.create({ email, passwordHash });
    } catch (err) {
      console.error('Error creating user:', err);
      if (err.message && err.message.includes('MongoDB')) {
        return res.status(503).json({ 
          error: { 
            message: 'Database connection not available. Please try again in a moment.' 
          } 
        });
      }
      throw err;
    }

    // Créer le dossier racine pour l'utilisateur
    const FolderModel = require('../models/folderModel');
    try {
      await FolderModel.create({ name: 'Root', ownerId: created.id, parentId: null });
    } catch (e) {
      console.error('Failed to create root folder for user:', e.message || e);
      // Ne pas bloquer l'inscription si la création du dossier échoue
    }

    const payload = { id: created.id, email: created.email };
    const access_token = generateAccessToken(payload);
    const refresh_token = generateRefreshToken(payload);

    // Persist refresh token in sessions table
    try {
      const userAgent = req.get('user-agent') || null;
      const ip = req.ip || req.headers['x-forwarded-for'] || null;
      await Session.createSession({ userId: created.id, refreshToken: refresh_token, userAgent, ipAddress: ip, deviceName: null, expiresIn: config.jwt.refreshExpiresIn });
    } catch (e) {
      console.error('Failed to create session for user:', e.message || e);
    }

    res.status(201).json({ data: { user: created, access_token, refresh_token }, message: 'Account created successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    // Si c'est une erreur MongoDB de connexion
    if (err.message && err.message.includes('MongoDB is not connected')) {
      return res.status(503).json({ 
        error: { 
          message: 'Database connection not available. Please try again in a moment.' 
        } 
      });
    }
    // Si c'est une erreur de validation Mongoose (email déjà utilisé)
    if (err.name === 'MongoServerError' && err.code === 11000) {
      return res.status(409).json({ error: { message: 'Email already in use' } });
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

    const user = await User.findByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
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
      console.error('Failed to create session on login:', e.message || e);
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

    res.status(200).json({ data: { user: safeUser, access_token, refresh_token }, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    if (err.message && err.message.includes('MongoDB is not connected')) {
      return res.status(503).json({ 
        error: { 
          message: 'Database connection not available. Please try again in a moment.' 
        } 
      });
    }
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: { message: 'Refresh token is required' } });
    }

    // Vérifier le refresh token
    let decoded;
    try {
      decoded = verifyToken(refresh_token, true);
    } catch (err) {
      return res.status(401).json({ error: { message: 'Invalid or expired refresh token' } });
    }

    // Vérifier que la session existe et n'est pas révoquée
    const session = await Session.findByToken(refresh_token);
    if (!session || session.is_revoked) {
      return res.status(401).json({ error: { message: 'Invalid or expired refresh token' } });
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
      message: 'Token refreshed successfully' 
    });
  } catch (err) {
    console.error('Refresh error:', err);
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      await Session.revokeByToken(refresh_token);
    }

    res.status(200).json({ message: 'Logout successful' });
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
    const { email } = req.body;

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

    if (!emailSent) {
      console.error('Failed to send reset email to:', email);
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
    const { token } = req.params;

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
    console.error('Verify reset token error:', err);
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
    const user = await User.verifyResetToken(token);
    
    if (!user) {
      return res.status(400).json({ 
        error: { message: 'Ce lien a expiré (15 minutes) ou est invalide. Refaites une demande de réinitialisation.' } 
      });
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Mettre à jour le mot de passe
    const success = await User.resetPassword(token, passwordHash);

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
    console.error('Reset password error:', err);
    next(err);
  }
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};

