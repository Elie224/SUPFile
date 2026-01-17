# Configuration Admin sur Render - MongoDB Atlas

Puisque l'application est déjà déployée sur Render avec MongoDB Atlas, voici comment configurer `kouroumaelisee@gmail.com` comme administrateur directement dans MongoDB.

## 🎯 Méthode recommandée : MongoDB Atlas (via MongoDB Compass ou Shell)

### Option 1 : Via MongoDB Compass (Interface graphique)

1. **Télécharger MongoDB Compass** (si pas déjà installé)
   - [Télécharger MongoDB Compass](https://www.mongodb.com/try/download/compass)

2. **Connecter à MongoDB Atlas**
   - Ouvrez MongoDB Compass
   - Récupérez votre URI de connexion depuis Render :
     - Allez sur [Render Dashboard](https://dashboard.render.com/)
     - Ouvrez votre service `supfile-backend`
     - Allez dans **"Environment"** 
     - Copiez la valeur de `MONGO_URI` (format : `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)
   - Collez l'URI dans Compass et connectez-vous

3. **Trouver la collection `users`**
   - Dans la base de données (probablement `supfile` ou le nom spécifié dans MONGO_URI)
   - Ouvrez la collection `users`

4. **Modifier l'utilisateur**
   - Recherchez l'utilisateur avec l'email `kouroumaelisee@gmail.com`
   - Cliquez sur l'utilisateur pour l'éditer
   - Ajoutez ou modifiez le champ `is_admin` : mettez `true`
   - Sauvegardez

### Option 2 : Via MongoDB Shell (mongosh) ou Atlas UI

#### Via MongoDB Atlas Web UI

1. **Connecter à MongoDB Atlas**
   - Allez sur [MongoDB Atlas](https://cloud.mongodb.com/)
   - Connectez-vous à votre compte
   - Sélectionnez votre cluster

2. **Accéder à la base de données**
   - Cliquez sur **"Browse Collections"**
   - Sélectionnez votre base de données (ex: `supfile`)
   - Ouvrez la collection `users`

3. **Modifier l'utilisateur**
   - Recherchez `kouroumaelisee@gmail.com` dans la collection
   - Cliquez sur l'utilisateur
   - Ajoutez/modifiez le champ `is_admin` à `true`
   - Cliquez sur **"Update"**

#### Via MongoDB Shell (mongosh)

1. **Connecter via mongosh**
   ```bash
   # Si mongosh n'est pas installé
   # Windows: téléchargez depuis https://www.mongodb.com/try/download/shell
   
   # Utilisez votre URI de connexion
   mongosh "mongodb+srv://user:pass@cluster.mongodb.net/supfile"
   ```

2. **Exécuter la commande**
   ```javascript
   use supfile  // ou le nom de votre base de données
   
   db.users.updateOne(
     { email: "kouroumaelisee@gmail.com" },
     { $set: { is_admin: true } }
   )
   ```

3. **Vérifier la modification**
   ```javascript
   db.users.findOne({ email: "kouroumaelisee@gmail.com" })
   // Vous devriez voir: "is_admin" : true
   ```

### Option 3 : Via Render Shell (si disponible)

Si Render fournit un shell pour votre service :

1. Allez sur le dashboard Render
2. Ouvrez votre service `supfile-backend`
3. Cliquez sur **"Shell"** (si disponible)
4. Exécutez :
   ```bash
   node -e "
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGO_URI).then(() => {
     mongoose.connection.db.collection('users').updateOne(
       { email: 'kouroumaelisee@gmail.com' },
       { \$set: { is_admin: true } }
     ).then(() => {
       console.log('✅ Admin configuré');
       process.exit(0);
     });
   });
   "
   ```

## ✅ Vérification après configuration

1. **Déconnectez-vous et reconnectez-vous** dans l'application web
   - Ceci rafraîchit le token JWT avec le statut `is_admin`
   
2. **Vérifiez l'accès admin**
   - Le menu devrait afficher **"⚙️ Administration"**
   - Vous pouvez accéder à `/admin`

3. **Vérifiez dans les DevTools** (F12)
   - Application > Local Storage > `auth-storage`
   - Vous devriez voir : `"is_admin": true`

## 🔧 Si vous préférez utiliser le script corrigé localement

Si vous voulez utiliser le script localement (mais vous devez avoir MongoDB accessible localement ou utiliser le même MONGO_URI que Render) :

```bash
cd backend
# Assurez-vous d'avoir MONGO_URI configuré pour pointer vers Atlas
node scripts/setAdmin.js
```

**Note** : Le script local ne fonctionne que si vous pouvez vous connecter à la même base MongoDB que Render.

## 🚨 Important

- Après avoir défini `is_admin: true` dans MongoDB, **déconnectez-vous et reconnectez-vous** pour que le nouveau statut soit pris en compte (le JWT doit être régénéré)
- Assurez-vous que l'utilisateur `kouroumaelisee@gmail.com` existe déjà dans la base de données avant de modifier `is_admin`

## 📋 Structure de l'utilisateur dans MongoDB

Après modification, l'utilisateur devrait ressembler à :

```json
{
  "_id": ObjectId("..."),
  "email": "kouroumaelisee@gmail.com",
  "display_name": "...",
  "is_admin": true,  // ← Doit être true
  "is_active": true,
  "quota_limit": 32212254720,
  "quota_used": 0,
  ...
}
```

---

**Recommandation** : Utilisez MongoDB Compass ou Atlas UI pour une modification rapide et visuelle.
