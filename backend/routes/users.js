const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { validate, changePasswordSchema } = require('../middlewares/validation');
const { validateFileUpload } = require('../middlewares/fileValidation');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Obtenir les informations de l'utilisateur connecté
router.get('/me', usersController.getMe);

// Mettre à jour le profil
router.patch('/me', usersController.updateProfile);

// Uploader un avatar (multer gère l'upload, puis validation)
router.post('/me/avatar', usersController.uploadAvatar);

// Changer le mot de passe
router.patch('/me/password', validate(changePasswordSchema), usersController.changePassword);

// Mettre à jour les préférences
router.patch('/me/preferences', usersController.updatePreferences);

// Lister les utilisateurs (pour le partage interne)
router.get('/', usersController.listUsers);

module.exports = router;

