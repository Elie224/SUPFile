const express = require('express');
const router = express.Router();
const foldersController = require('../controllers/foldersController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { validate, createFolderSchema, renameSchema } = require('../middlewares/validation');
const { validateObjectId } = require('../middlewares/security');

// Routes protégées
router.use(authMiddleware);

// Lister les dossiers (GET /api/folders?parent_id=xxx) - avant validateObjectId
router.get('/', foldersController.listFolders);

router.use(validateObjectId); // Valider tous les ObjectIds dans les paramètres

// Créer un dossier
router.post('/', validate(createFolderSchema), foldersController.createFolder);

// Lister les dossiers supprimés (corbeille) - DOIT être avant les autres routes /:id
router.get('/trash', foldersController.listTrash);

// Télécharger un dossier complet en ZIP
// DOIT être avant router.get('/:id', ...) sinon Express matchera /:id
router.get('/:id/download', foldersController.downloadFolderZip);

// Récupérer un dossier par ID
router.get('/:id', foldersController.getFolder);

// Mettre à jour un dossier (rename/move)
router.patch('/:id', validate(renameSchema), foldersController.updateFolder);

// Supprimer un dossier
router.delete('/:id', foldersController.deleteFolder);

// Restaurer un dossier
router.post('/:id/restore', foldersController.restoreFolder);

module.exports = router;

