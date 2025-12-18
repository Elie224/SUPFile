# 🔒 Installation des améliorations de sécurité

## 📋 Prérequis

Avant d'appliquer les améliorations de sécurité, assurez-vous d'avoir :
- Node.js installé (version 18 ou supérieure)
- npm installé
- Accès au répertoire `backend/`

## 🚀 Installation

### Étape 1 : Installer la nouvelle dépendance

```bash
cd backend
npm install express-rate-limit
```

### Étape 2 : Vérifier les fichiers créés

Les nouveaux fichiers de sécurité ont été créés :
- ✅ `backend/middlewares/rateLimiter.js`
- ✅ `backend/middlewares/security.js`
- ✅ `backend/middlewares/fileValidation.js`

### Étape 3 : Vérifier les modifications

Les fichiers suivants ont été modifiés :
- ✅ `backend/app.js` (intégration des middlewares)
- ✅ `backend/package.json` (nouvelle dépendance)
- ✅ `backend/routes/files.js` (rate limiting et validation)
- ✅ `backend/routes/folders.js` (validation ObjectId)
- ✅ `backend/routes/share.js` (rate limiting et validation)
- ✅ `backend/routes/users.js` (validation fichiers)
- ✅ `backend/controllers/filesController.js` (amélioration validation)

### Étape 4 : Redémarrer le serveur

```bash
# En développement
npm run dev

# En production
npm start
```

## ✅ Vérification

### Tester le rate limiting

1. **Tester l'authentification :**
   ```bash
   # Faire 6 tentatives de connexion avec un mauvais mot de passe
   # La 6ème devrait être bloquée avec une erreur 429
   ```

2. **Tester l'upload :**
   ```bash
   # Faire plus de 50 uploads en une heure
   # Les uploads supplémentaires devraient être bloqués
   ```

### Tester la validation

1. **Tester un ObjectId invalide :**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/files/invalid-id
   # Devrait retourner 400 avec "Invalid id format"
   ```

2. **Tester un fichier dangereux :**
   ```bash
   # Essayer d'uploader un fichier .exe
   # Devrait être bloqué avec une erreur 403
   ```

## 🔧 Configuration optionnelle

### Variables d'environnement

Ajoutez ces variables dans votre `.env` pour un contrôle fin :

```env
# Validation stricte des types MIME (true/false)
STRICT_MIME_VALIDATION=false

# Autoriser tous les types en développement (true/false)
ALLOW_ALL_FILE_TYPES=false

# Taille maximale des fichiers (bytes)
MAX_FILE_SIZE=32212254720
```

## 📝 Notes importantes

1. **Rate limiting :** Les limites sont configurées pour être raisonnables en production. Ajustez selon vos besoins.

2. **Validation des fichiers :** En développement, la validation est plus souple pour faciliter les tests. En production, elle est stricte.

3. **Logs :** Les tentatives bloquées par le rate limiting sont loggées automatiquement.

4. **Performance :** Le rate limiting utilise la mémoire par défaut. Pour la production à grande échelle, considérez utiliser Redis.

## 🆘 Dépannage

### Erreur "express-rate-limit not found"

```bash
cd backend
npm install express-rate-limit
```

### Rate limiting trop strict

Modifiez les limites dans `backend/middlewares/rateLimiter.js` :
- `max` : Nombre de requêtes autorisées
- `windowMs` : Fenêtre de temps en millisecondes

### Validation trop stricte

En développement, vous pouvez désactiver certaines validations :
- `STRICT_MIME_VALIDATION=false` : Validation MIME souple
- `ALLOW_ALL_FILE_TYPES=true` : Autoriser tous les types

---

**Installation terminée !** ✅

Votre application est maintenant mieux protégée contre les vulnérabilités courantes.

