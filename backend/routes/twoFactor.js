const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/2fa/status
 * @desc    Récupère le statut 2FA de l'utilisateur
 * @access  Private
 */
router.get('/status', authMiddleware, twoFactorController.get2FAStatus);

/**
 * @route   POST /api/2fa/setup
 * @desc    Génère un secret et QR code pour configurer le 2FA
 * @access  Private
 */
router.post('/setup', authMiddleware, twoFactorController.setup2FA);

/**
 * @route   POST /api/2fa/verify
 * @desc    Vérifie le code 2FA et active le 2FA
 * @access  Private
 */
router.post('/verify', authMiddleware, twoFactorController.verify2FA);

/**
 * @route   POST /api/2fa/disable
 * @desc    Désactive le 2FA (nécessite le mot de passe)
 * @access  Private
 */
router.post('/disable', authMiddleware, twoFactorController.disable2FA);

/**
 * @route   POST /api/2fa/verify-login
 * @desc    Vérifie le code 2FA lors de la connexion
 * @access  Public (mais nécessite userId)
 */
router.post('/verify-login', twoFactorController.verifyLoginCode);

module.exports = router;
