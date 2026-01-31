const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const UserModel = require('../models/userModel');
const logger = require('../utils/logger');

/**
 * Génère un secret 2FA et un QR code pour l'utilisateur
 */
exports.setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'Utilisateur non trouvé' }
      });
    }

    // Vérifier si le 2FA est déjà activé
    if (user.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        error: { message: 'Le 2FA est déjà activé pour ce compte' }
      });
    }

    // Générer un secret TOTP
    const secret = speakeasy.generateSecret({
      name: `SUPFile (${user.email})`,
      issuer: 'SUPFile',
      length: 32
    });

    // Générer des codes de secours (8 codes de 8 caractères)
    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
    }

    // Générer le QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Stocker temporairement le secret (sera confirmé lors de la vérification)
    // On ne l'active pas encore, il faut d'abord vérifier que l'utilisateur peut générer des codes
    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeDataUrl,
        backupCodes: backupCodes,
        manualEntry: secret.base32 // Pour saisie manuelle dans l'app
      }
    });

    logger.info(`2FA setup initiated for user ${userId}`);
  } catch (error) {
    logger.error('Error setting up 2FA:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors de la configuration du 2FA' }
    });
  }
};

/**
 * Vérifie le code 2FA et active le 2FA pour l'utilisateur
 */
exports.verify2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token, secret, backupCodes } = req.body;

    if (!token || !secret || !backupCodes) {
      return res.status(400).json({
        success: false,
        error: { message: 'Token, secret et codes de secours requis' }
      });
    }

    // Vérifier le token TOTP
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Accepte les codes dans une fenêtre de ±2 intervalles (30s chacun)
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: { message: 'Code de vérification invalide' }
      });
    }

    // Activer le 2FA
    await UserModel.enable2FA(userId, secret, backupCodes);

    res.json({
      success: true,
      data: {
        message: 'Double authentification activée avec succès',
        two_factor_enabled: true
      }
    });

    logger.info(`2FA enabled for user ${userId}`);
  } catch (error) {
    logger.error('Error verifying 2FA:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors de la vérification du 2FA' }
    });
  }
};

/**
 * Désactive le 2FA pour l'utilisateur
 */
exports.disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Mot de passe requis pour désactiver le 2FA' }
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'Utilisateur non trouvé' }
      });
    }

    // Vérifier le mot de passe
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: { message: 'Mot de passe incorrect' }
      });
    }

    // Désactiver le 2FA
    await UserModel.disable2FA(userId);

    res.json({
      success: true,
      data: {
        message: 'Double authentification désactivée avec succès',
        two_factor_enabled: false
      }
    });

    logger.info(`2FA disabled for user ${userId}`);
  } catch (error) {
    logger.error('Error disabling 2FA:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors de la désactivation du 2FA' }
    });
  }
};

/**
 * Vérifie un code 2FA lors de la connexion
 */
exports.verifyLoginCode = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID utilisateur et token requis' }
      });
    }

    const user = await UserModel.findById(userId);
    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        error: { message: 'Utilisateur non trouvé ou 2FA non activé' }
      });
    }

    // Vérifier si c'est un code de secours
    const isBackupCode = user.two_factor_backup_codes.includes(token);
    
    if (isBackupCode) {
      // Utiliser le code de secours
      const used = await UserModel.useBackupCode(userId, token);
      if (!used) {
        return res.status(400).json({
          success: false,
          error: { message: 'Code de secours invalide' }
        });
      }

      return res.json({
        success: true,
        data: {
          verified: true,
          backupCodeUsed: true,
          remainingBackupCodes: user.two_factor_backup_codes.length - 1
        }
      });
    }

    // Vérifier le token TOTP
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: { message: 'Code de vérification invalide' }
      });
    }

    res.json({
      success: true,
      data: {
        verified: true,
        backupCodeUsed: false
      }
    });

    logger.info(`2FA login code verified for user ${userId}`);
  } catch (error) {
    logger.error('Error verifying login code:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors de la vérification du code' }
    });
  }
};

/**
 * Récupère le statut 2FA de l'utilisateur
 */
exports.get2FAStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'Utilisateur non trouvé' }
      });
    }

    res.json({
      success: true,
      data: {
        two_factor_enabled: user.two_factor_enabled || false,
        backup_codes_count: user.two_factor_backup_codes ? user.two_factor_backup_codes.length : 0
      }
    });
  } catch (error) {
    logger.error('Error getting 2FA status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors de la récupération du statut 2FA' }
    });
  }
};
