# Configuration Admin Principal - kouroumaelisee@gmail.com

## ✅ Configuration actuelle

Le compte **`kouroumaelisee@gmail.com`** doit être configuré comme administrateur principal pour accéder à l'interface admin.

## 🔧 Comment configurer l'admin

### Option 1 : Via le script Node.js (Recommandé)

1. Assurez-vous que MongoDB est connecté et que l'utilisateur existe
2. Exécutez le script :

```bash
cd backend
node scripts/setAdmin.js
```

Le script affichera :
```
✅ Connexion MongoDB établie
✅ kouroumaelisee@gmail.com est maintenant administrateur
```

### Option 2 : Via MongoDB directement

1. Connectez-vous à MongoDB Atlas ou votre instance MongoDB
2. Exécutez la commande :

```javascript
db.users.updateOne(
  { email: "kouroumaelisee@gmail.com" },
  { $set: { is_admin: true } }
)
```

## 🎯 Vérification de l'accès admin

### 1. Vérifier que vous êtes connecté avec le bon compte

- Connectez-vous avec **`kouroumaelisee@gmail.com`** (via OAuth Google ou email/password)
- Une fois connecté, vérifiez dans les DevTools (F12) > Application > Local Storage > `auth-storage` :
  ```json
  {
    "user": {
      "email": "kouroumaelisee@gmail.com",
      "is_admin": true
    }
  }
  ```

### 2. Vérifier l'accès à la page admin

Une fois connecté avec un compte admin :

- ✅ Le menu de navigation affiche **"⚙️ Administration"**
- ✅ L'URL `/admin` est accessible
- ✅ La page admin affiche :
  - Statistiques générales (utilisateurs, fichiers, dossiers, stockage)
  - Liste des utilisateurs avec pagination
  - Recherche d'utilisateurs
  - Modification/suppression d'utilisateurs

### 3. Si l'accès admin ne fonctionne pas

1. **Déconnectez-vous et reconnectez-vous** (pour rafraîchir le token JWT avec `is_admin`)
2. Vérifiez dans MongoDB que `is_admin: true` est bien défini :
   ```javascript
   db.users.findOne({ email: "kouroumaelisee@gmail.com" })
   ```
3. Vérifiez les logs du backend pour voir si le middleware admin bloque l'accès

## 📋 Fonctionnalités de l'interface admin

Une fois connecté avec le compte admin, vous avez accès à :

### Statistiques générales
- Nombre total d'utilisateurs (actifs/inactifs)
- Nombre total de fichiers
- Nombre total de dossiers
- Stockage total utilisé

### Gestion des utilisateurs
- ✅ **Liste complète** avec pagination (20 utilisateurs par page)
- ✅ **Recherche** par email ou nom d'affichage
- ✅ **Modification** :
  - Nom d'affichage
  - Quota de stockage (en GB)
  - Statut actif/inactif
  - Droits administrateur
- ✅ **Suppression** d'utilisateurs (sauf votre propre compte)

## 🔒 Sécurité

- Toutes les routes admin sont protégées par :
  - Authentification JWT (`authMiddleware`)
  - Vérification des droits admin (`adminMiddleware`)
- Les utilisateurs non-admins sont automatiquement redirigés vers `/dashboard`
- Vous ne pouvez pas supprimer votre propre compte administrateur

## 🚀 Accès rapide

1. Connectez-vous avec **`kouroumaelisee@gmail.com`**
2. Cliquez sur **"⚙️ Administration"** dans le menu de navigation
3. Ou accédez directement à : `https://votre-frontend.com/admin`

---

**Note** : Si vous utilisez OAuth Google, assurez-vous que le compte Google associé à `kouroumaelisee@gmail.com` est bien utilisé pour la connexion.
