const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, signupSchema, loginSchema } = require('../middlewares/validation');
const { initiateOAuth, handleOAuthCallback } = require('../controllers/oauthController');

// POST /api/auth/signup
router.post('/signup', validate(signupSchema), authController.signup);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// GET /api/auth/verify-reset-token/:token
router.get('/verify-reset-token/:token', authController.verifyResetToken);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// Routes OAuth - Initiation
router.get('/google', initiateOAuth('google'));
router.get('/github', initiateOAuth('github'));

// Routes OAuth - Callbacks (GET pour web avec Passport)
router.get('/google/callback', handleOAuthCallback('google'));
router.get('/github/callback', handleOAuthCallback('github'));

// Routes OAuth - Callbacks Mobile (POST pour mobile natif)
const oauthMobileController = require('../controllers/oauthMobileController');
router.post('/google/callback', oauthMobileController.handleGoogleMobileCallback);
router.post('/github/callback', oauthMobileController.handleGitHubMobileCallback);

module.exports = router;



