# Guide étape par étape : Configurer l'admin sur MongoDB Atlas

## 🎯 Objectif
Configurer `kouroumaelisee@gmail.com` comme administrateur dans MongoDB Atlas (pour Render).

---

## 📋 Étape 1 : Récupérer l'URI de connexion MongoDB Atlas

### Via Render Dashboard

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquez sur votre service **`supfile-backend`**
3. Ouvrez l'onglet **"Environment"**
4. Trouvez la variable **`MONGO_URI`**
5. **Copiez la valeur complète** (format : `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)
   - ⚠️ **Attention** : Gardez cette URI confidentielle !
   - Notez aussi le nom de la base de données (dernier segment après `/`)

---

## 📋 Étape 2 : Se connecter à MongoDB Atlas

### Option A : Via MongoDB Atlas Web UI (Recommandé - Plus simple)

1. Allez sur [MongoDB Atlas](https://cloud.mongodb.com/)
2. **Connectez-vous** à votre compte MongoDB Atlas
3. Sélectionnez votre **projet/cluster**
4. Cliquez sur **"Browse Collections"** (bouton vert en haut)

### Option B : Via MongoDB Compass (Alternative)

1. **Téléchargez MongoDB Compass** si vous ne l'avez pas :
   - [Télécharger MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. **Ouvrez MongoDB Compass**
3. Collez l'URI que vous avez copiée de Render (`MONGO_URI`)
4. Cliquez sur **"Connect"**

---

## 📋 Étape 3 : Trouver l'utilisateur

### Via MongoDB Atlas Web UI

1. Dans **"Browse Collections"**, vous verrez votre base de données (ex: `supfile`)
2. **Ouvrez** votre base de données
3. **Ouvrez** la collection **`users`**
4. **Recherchez** l'utilisateur avec l'email `kouroumaelisee@gmail.com` :
   - Utilisez la barre de recherche en haut de la collection
   - Tapez : `kouroumaelisee@gmail.com`

### Via MongoDB Compass

1. Dans la liste des bases de données, **ouvrez** votre base (ex: `supfile`)
2. **Ouvrez** la collection **`users`**
3. Dans la barre de recherche, tapez : `{ "email": "kouroumaelisee@gmail.com" }`

---

## 📋 Étape 4 : Modifier l'utilisateur pour ajouter `is_admin: true`

### Via MongoDB Atlas Web UI

1. **Cliquez sur l'utilisateur** trouvé (`kouroumaelisee@gmail.com`)
2. Une fenêtre de détails s'ouvre
3. **Cliquez sur le bouton "Edit Document"** (icône crayon)
4. Dans le document JSON, **ajoutez ou modifiez** le champ `is_admin` :
   
   **Si le champ `is_admin` existe déjà :**
   - Changez la valeur de `false` à `true`
   
   **Si le champ `is_admin` n'existe pas :**
   - Cliquez sur **"Add Field"**
   - **Field name** : `is_admin`
   - **Field value** : `true` (type : Boolean)
   
5. **Cliquez sur "Update"** en bas à droite

### Via MongoDB Compass

1. **Cliquez sur l'utilisateur** dans la liste
2. Cliquez sur **"Edit"** (bouton en haut)
3. Ajoutez ou modifiez le champ :
   - **Clé** : `is_admin`
   - **Valeur** : `true`
   - **Type** : `Boolean`
4. Cliquez sur **"Update"**

---

## ✅ Étape 5 : Vérifier la modification

### Vérification visuelle

Après la modification, le document utilisateur devrait contenir :
```json
{
  "_id": ObjectId("..."),
  "email": "kouroumaelisee@gmail.com",
  "display_name": "...",
  "is_admin": true,  // ← Doit être true
  "is_active": true,
  ...
}
```

### Vérification via requête

Si vous avez MongoDB Shell (mongosh) :

```javascript
db.users.findOne({ email: "kouroumaelisee@gmail.com" })
// Vérifiez que "is_admin" : true est présent
```

---

## 🔄 Étape 6 : Rafraîchir votre session dans l'application

**IMPORTANT** : Après avoir modifié `is_admin` dans MongoDB, vous devez régénérer votre token JWT.

1. **Déconnectez-vous** de l'application web (cliquez sur "Déconnexion")
2. **Reconnectez-vous** avec `kouroumaelisee@gmail.com` (OAuth Google ou email/password)
3. Le nouveau token JWT contiendra maintenant `is_admin: true`

---

## ✅ Étape 7 : Vérifier l'accès admin

### Dans l'application web

1. Après vous être reconnecté, **vérifiez le menu de navigation**
   - Vous devriez voir **"⚙️ Administration"** dans le menu
   
2. **Cliquez sur "⚙️ Administration"** ou allez à `/admin`
   - Vous devriez voir la page d'administration avec :
     - Statistiques générales
     - Liste des utilisateurs
     - Gestion des utilisateurs

### Vérification dans les DevTools (optionnel)

1. Ouvrez les **DevTools** (F12)
2. Allez dans **Application** > **Local Storage** > `auth-storage`
3. Vérifiez que le JSON contient :
   ```json
   {
     "user": {
       "email": "kouroumaelisee@gmail.com",
       "is_admin": true  // ← Doit être true
     }
   }
   ```

---

## 🆘 Dépannage

### L'utilisateur n'existe pas dans MongoDB Atlas

Si vous ne trouvez pas `kouroumaelisee@gmail.com` :
1. Connectez-vous d'abord à l'application avec ce compte (via OAuth Google ou inscription)
2. Cela créera automatiquement l'utilisateur dans MongoDB Atlas
3. Répétez ensuite les étapes 3-4 pour définir `is_admin: true`

### Le menu "Administration" n'apparaît pas après reconnexion

1. **Vérifiez dans MongoDB Atlas** que `is_admin: true` est bien présent
2. **Videz le cache du navigateur** (Ctrl+Shift+Delete)
3. **Supprimez les tokens dans Local Storage** :
   - DevTools (F12) > Application > Local Storage > `auth-storage` > Delete
4. **Reconnectez-vous** à nouveau

### Erreur "Access Denied" sur `/admin`

1. Vérifiez que vous êtes bien connecté avec `kouroumaelisee@gmail.com`
2. Vérifiez dans MongoDB Atlas que `is_admin: true` est défini
3. Déconnectez-vous et reconnectez-vous pour régénérer le JWT

---

## 📝 Résumé rapide

1. ✅ Récupérer `MONGO_URI` depuis Render
2. ✅ Se connecter à MongoDB Atlas (Web UI ou Compass)
3. ✅ Trouver la collection `users` dans votre base de données
4. ✅ Rechercher `kouroumaelisee@gmail.com`
5. ✅ Ajouter/modifier `is_admin: true`
6. ✅ Déconnecter/reconnecter dans l'application
7. ✅ Vérifier l'accès à `/admin`

---

**Félicitations !** Une fois ces étapes terminées, vous aurez accès à l'interface d'administration complète. 🎉
