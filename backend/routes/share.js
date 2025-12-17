const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/authMiddleware');
const { validate, publicShareSchema } = require('../middlewares/validation');

// Créer un partage public (authentifié)
router.post('/public', authMiddleware, validate(publicShareSchema), shareController.createPublicShare);

// Créer un partage interne (authentifié)
router.post('/internal', authMiddleware, shareController.createInternalShare);

// Accéder à un partage public (pas d'authentification requise)
router.get('/:token', optionalAuthMiddleware, shareController.getPublicShare);

// Lister les partages de l'utilisateur (authentifié)
router.get('/', authMiddleware, shareController.listShares);

// Désactiver un partage (authentifié)
router.delete('/:id', authMiddleware, shareController.deactivateShare);

module.exports = router;

