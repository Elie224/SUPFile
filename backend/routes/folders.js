const express = require('express');
const router = express.Router();
const foldersController = require('../controllers/foldersController');
const { authMiddleware, authHeaderOrQueryMiddleware } = require('../middlewares/authMiddleware');
const { validate, createFolderSchema, renameSchema } = require('../middlewares/validation');
const { validateObjectId } = require('../middlewares/security');

// Lister les dossiers (GET /api/folders?parent_id=xxx) - avant validateObjectId
router.get('/', authMiddleware, foldersController.listFolders);

// Lister tous les dossiers de l'utilisateur (flat list)
router.get('/all', authMiddleware, foldersController.listAllFolders);

router.use(validateObjectId); // Valider tous les ObjectIds dans les paramètres

// Créer un dossier
router.post('/', authMiddleware, validate(createFolderSchema), foldersController.createFolder);

// Lister les dossiers supprimés (corbeille) - DOIT être avant les autres routes /:id
router.get('/trash', authMiddleware, foldersController.listTrash);

// Télécharger un dossier complet en ZIP
// DOIT être avant router.get('/:id', ...) sinon Express matchera /:id
router.get('/:id/download', authHeaderOrQueryMiddleware, foldersController.downloadFolderZip);

// Récupérer un dossier par ID
router.get('/:id', authMiddleware, foldersController.getFolder);

// Mettre à jour un dossier (rename/move)
router.patch('/:id', authMiddleware, validate(renameSchema), foldersController.updateFolder);

// Supprimer un dossier
router.delete('/:id', authMiddleware, foldersController.deleteFolder);

// Restaurer un dossier
router.post('/:id/restore', authMiddleware, foldersController.restoreFolder);

module.exports = router;

