const express = require('express');
const router = express.Router();
const foldersController = require('../controllers/foldersController');
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/authMiddleware');
const { validate, createFolderSchema, renameSchema } = require('../middlewares/validation');
const { validateObjectId } = require('../middlewares/security');

// Télécharger un dossier (peut être public avec token de partage - DOIT être avant authMiddleware)
router.get('/:id/download', optionalAuthMiddleware, foldersController.downloadFolder);

// Routes protégées (toutes les autres routes nécessitent une authentification)
router.use(authMiddleware);
router.use(validateObjectId); // Valider tous les ObjectIds dans les paramètres

// Créer un dossier
router.post('/', validate(createFolderSchema), foldersController.createFolder);

// Lister les dossiers supprimés (corbeille) - DOIT être avant les autres routes /:id
router.get('/trash', foldersController.listTrash);

// Récupérer un dossier par ID
router.get('/:id', foldersController.getFolder);

// Mettre à jour un dossier (rename/move)
router.patch('/:id', validate(renameSchema), foldersController.updateFolder);

// Supprimer un dossier
router.delete('/:id', foldersController.deleteFolder);

// Restaurer un dossier
router.post('/:id/restore', foldersController.restoreFolder);

module.exports = router;

