const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateObjectId } = require('../middlewares/security');
const adminController = require('../controllers/adminController');

// Toutes les routes admin nécessitent l'authentification et les droits admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Statistiques générales
router.get('/stats', adminController.getStats);

// Gestion des utilisateurs
router.get('/users', adminController.getUsers);
router.get('/users/:id', validateObjectId, adminController.getUser);
router.put('/users/:id', validateObjectId, adminController.updateUser);
router.delete('/users/:id', validateObjectId, adminController.deleteUser);

module.exports = router;

