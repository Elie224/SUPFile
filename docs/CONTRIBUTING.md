# Guide de Contribution - SUPFile

Bienvenue ! Ce guide explique comment contribuer au projet SUPFile de manière cohérente et efficace.

## Avant de commencer

- ✅ Lire le `README.md` et `ARCHITECTURE.md`
- ✅ Installer Docker et Node.js
- ✅ Cloner le dépôt (privé !)
- ✅ Lancer `docker compose up -d`
- ✅ Vérifier que tout fonctionne

---

## Workflow Git

### 1. Créer une branche feature

Toujours créer une nouvelle branche pour chaque feature/bug :

```bash
# À partir de 'main' (à jour)
git checkout main
git pull origin main

# Créer branche feature
git checkout -b feature/description-courte
```

**Convention de nommage** :
- `feature/file-upload` - Nouvelle fonctionnalité
- `bugfix/auth-token-issue` - Correction de bug
- `docs/api-documentation` - Documentation
- `refactor/auth-middleware` - Refactoring
- `chore/update-dependencies` - Maintenance

### 2. Travailler sur la branche

Développer la feature/fix :

```bash
# Tester en local
npm run dev         # Backend ou Frontend

# Vérifier les tests
npm test

# Committer régulièrement
git add .
git commit -m "feat: add file upload with progress bar

- Implement multipart upload handler
- Add progress bar UI component
- Add error handling and retry logic
- Add tests for upload validation"
```

**Convention de commits** (Conventional Commits) :

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types** :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage (pas de logique)
- `refactor` : Refactoring sans feature
- `perf` : Amélioration de performance
- `test` : Ajout/modification tests
- `chore` : Maintenance, dépendances

**Exemple complet** :

```
feat(auth): implement OAuth2 Google login

- Add Google OAuth2 provider configuration
- Implement /api/auth/oauth endpoint
- Auto-create user account on first login
- Add error handling for OAuth failures

Closes #42
```

### 3. Pusher et créer une Pull Request

```bash
# Pusher la branche
git push -u origin feature/description-courte

# Sur GitHub : Créer une Pull Request (PR)
```

**Description de PR** (utiliser le template) :

```markdown
## Description
Brève description de la feature/fix

## Motivation
Pourquoi cette change est nécessaire ?

## Changes
- Change 1
- Change 2
- Change 3

## Testing
Comment tester cette change ?
- [ ] Tested locally
- [ ] Added unit tests
- [ ] Tested with Docker

## Checklist
- [ ] Code suit les conventions
- [ ] Pas de secrets en clair
- [ ] Documentation mise à jour
- [ ] Tests passent
```

### 4. Validation et merge

- Autre dev : Review code
- CI/CD : Lancer tests automatiques
- Approuver et merger dans `main`

```bash
# Une fois mergé, nettoyer local
git checkout main
git pull origin main
git branch -d feature/description-courte
```

---

## Standards de code

### Backend (Node.js/Express)

**Structure** :

```javascript
// 1. Imports
const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');

// 2. Constants
const MAX_SIZE = 5368709120;

// 3. Main function / Controller
async function uploadFile(req, res, next) {
  try {
    // Logique
  } catch (err) {
    next(err); // Passer à error handler
  }
}

// 4. Exports
module.exports = { uploadFile };
```

**Style** :
- Indentation : 2 espaces
- Variables : camelCase
- Constantes : SCREAMING_SNAKE_CASE
- Fonctions : verbeNoun (uploadFile, deleteFolder)
- Classes : PascalCase

**Validation** :

```javascript
// ✅ BON - Validation côté serveur
const { error, value } = schema.validate(req.body);
if (error) return res.status(400).json({ error });

// ❌ MAUVAIS - Faire confiance au client
const { email, password } = req.body; // Sans validation
```

**Gestion d'erreurs** :

```javascript
// ✅ BON - Erreurs structurées
if (!file) {
  return res.status(400).json({
    error: { message: 'File required', details: [...] }
  });
}

// ❌ MAUVAIS - Erreurs non structurées
if (!file) throw new Error('File required');
```

**Logging** :

```javascript
// ✅ BON
logger.info('File uploaded', { fileId: 123, size: 1024 });

// ❌ MAUVAIS
console.log('File uploaded');
```

### Frontend (React)

**Structure des composants** :

```jsx
import React, { useState } from 'react';
import styles from './Component.module.css';

// 1. Component
function MyComponent({ prop1, prop2 }) {
  // State
  const [state, setState] = useState('');

  // Effects

  // Handlers
  const handleClick = () => {};

  // Render
  return <div className={styles.container}>...</div>;
}

// 2. PropTypes / TypeScript
MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

// 3. Export
export default MyComponent;
```

**Naming** :
- Composants : PascalCase (FileUploader)
- Props/state : camelCase (isLoading)
- CSS classes : kebab-case (file-uploader)
- Handlers : handleXxx (handleSubmit)

**API calls** :
```javascript
// ✅ BON - via service API
import { fileService } from '../services/api';

const handleUpload = async (file) => {
  try {
    const response = await fileService.upload(file, folderId);
    // Success handling
  } catch (err) {
    // Error handling
  }
};

// ❌ MAUVAIS - appels directs
fetch('http://localhost:5000/api/files/upload', {...})
```

**State management** :
```javascript
// ✅ BON - Zustand store
import { useAuthStore } from '../services/authStore';

function LoginPage() {
  const { login, isLoading, error } = useAuthStore();
  return <button onClick={() => login(email, password)}>...</button>;
}

// ❌ MAUVAIS - Props drilling
<AuthContext.Provider value={...}>
  <Parent user={user} setUser={setUser}>
    <Child user={user} setUser={setUser} />
  </Parent>
</AuthContext.Provider>
```

### Base de données

**Migrations SQL** :

```sql
-- ✅ BON - Nommage clair, commentaires
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  -- Hash bcrypt du mot de passe
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ❌ MAUVAIS - Noms ambigus
CREATE TABLE t (
  id INT,
  e VARCHAR(255),
  p VARCHAR(255)
);
```

**Indices** :
```sql
-- ✅ BON - Indices sur colonnes fréquemment filtrées
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_files_owner ON files(owner_id);

-- ❌ MAUVAIS - Pas d'indices (lent)
SELECT * FROM files WHERE name LIKE '%report%';
```

---

## Testing

### Backend

```bash
cd backend
npm test

# Coverage
npm test -- --coverage
```

**Écrire des tests** :

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../app');

describe('Authentication', () => {
  test('POST /api/auth/login should return token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'Password123!' });

    expect(response.status).toBe(200);
    expect(response.body.data.access_token).toBeDefined();
  });

  test('POST /api/auth/login should fail with wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'wrong' });

    expect(response.status).toBe(401);
  });
});
```

### Frontend

```bash
cd frontend-web
npm test

# Watch mode
npm test -- --watch
```

**Écrire des tests** :

```javascript
// src/components/__tests__/FileUploader.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import FileUploader from '../FileUploader';

describe('FileUploader', () => {
  test('renders upload button', () => {
    render(<FileUploader />);
    expect(screen.getByText(/Upload/i)).toBeInTheDocument();
  });

  test('shows progress when uploading', () => {
    render(<FileUploader />);
    // Simuler un upload
    // Vérifier que la progress bar apparaît
  });
});
```

---

## Sécurité

### Checklist avant tout commit

❌ **JAMAIS commiter** :
- `.env` (variables d'environnement)
- Clés API OAuth
- Tokens ou secrets
- Mots de passe
- Fichiers binaires gros

✅ **Toujours** :
- Valider les inputs côté serveur
- Hacher les mots de passe avec bcryptjs
- Signer les tokens JWT avec secret fort
- Utiliser HTTPS en production
- Implémenter rate limiting
- Vérifier la propriété avant toute opération

### Exemple : Protection d'endpoint

```javascript
// ✅ BON - Vérifier ownership
router.delete('/files/:id', authMiddleware, async (req, res) => {
  const file = await File.findById(req.params.id);
  
  // Vérifier que l'utilisateur est propriétaire
  if (file.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  await file.delete();
  res.status(204).send();
});

// ❌ MAUVAIS - Pas de vérification
router.delete('/files/:id', authMiddleware, async (req, res) => {
  await File.findByIdAndDelete(req.params.id); // N'importe qui peut supprimer
  res.status(204).send();
});
```

---

## Documentation

### Commenter le code

**Bon commentaire** :
```javascript
// Hacher le mot de passe avec 10 salt rounds
// pour performance optimale vs sécurité
const passwordHash = await bcryptjs.hash(password, 10);
```

**Mauvais commentaire** :
```javascript
// Hash la password
const passwordHash = bcryptjs.hash(password, 10);
```

### Documenter les fonctions

```javascript
/**
 * Uploader un fichier vers le serveur
 * @param {File} file - Fichier à uploader
 * @param {number} folderId - ID du dossier cible
 * @returns {Promise<Object>} Métadonnées du fichier uploadé
 * @throws {Error} Si fichier trop gros ou quota dépassé
 */
async function uploadFile(file, folderId) {
  // ...
}
```

### Maintenir la documentation

- ✅ Mettre à jour `docs/API.md` si new endpoint
- ✅ Mettre à jour `docs/ARCHITECTURE.md` si architecture change
- ✅ Ajouter des exemples dans `docs/`
- ✅ Documenter les breeaking changes

---

## Code Review Checklist

Pour reviewer une PR, vérifier :

**Fonctionnalité** :
- [ ] Code fait ce qu'il prétend faire
- [ ] Pas de bugs évidents
- [ ] Edge cases gérés
- [ ] Tests couvrent les cas importants

**Sécurité** :
- [ ] Pas de secrets en clair
- [ ] Inputs validés
- [ ] Ownership vérifié
- [ ] Rate limiting si nécessaire

**Qualité** :
- [ ] Code lisible et maintenable
- [ ] Pas de duplication
- [ ] Conventions respectées
- [ ] Performance acceptable

**Documentation** :
- [ ] Docs mises à jour
- [ ] Commentaires clairs
- [ ] Changelog mentionné (si besoin)

---

## Problèmes courants

### "Node modules out of sync"

```bash
rm -rf backend/node_modules package-lock.json
npm install
```

### "Docker container won't start"

```bash
docker compose logs backend  # Voir l'erreur
docker compose down -v
docker compose up -d
```

### "Merge conflict"

```bash
# Résoudre les conflits dans l'éditeur
git add .
git commit -m "Merge branch main into feature/xxx"
git push
```

---

## Questions ?

- Consulter `docs/ARCHITECTURE.md`
- Ouvrir une issue pour discussion
- Demander à un autre dev du team

---

Bon coding ! 🚀

Document créé : Décembre 2025
