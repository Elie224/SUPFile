# Configuration Admin MongoDB Atlas - Méthode Directe

## 🚀 Option 1 : Exécution directe (sans script .ps1)

Au lieu d'utiliser le script PowerShell, vous pouvez exécuter directement :

### Dans PowerShell

```powershell
cd backend

# Demander l'URI
$mongoUri = Read-Host "Collez votre MONGO_URI MongoDB Atlas depuis Render (mongodb+srv://[REDACTED]"

# Exécuter le script Node.js avec l'URI Atlas
$env:MONGO_URI=[REDACTED]
node scripts/setAdmin.js
```

**C'est tout !** Le script `setAdmin.js` utilisera automatiquement `$env:MONGO_URI` pour se connecter à MongoDB Atlas.

---

## 🎯 Option 2 : Via MongoDB Atlas Web UI (Plus simple - Recommandé)

C'est la méthode la plus simple et visuelle :

### Étapes :

1. **Récupérer MONGO_URI depuis Render**
   - Allez sur [Render Dashboard](https://dashboard.render.com/)
   - Ouvrez `supfile-backend` → **Environment**
   - Copiez la valeur de `MONGO_URI`

2. **Connectez-vous à MongoDB Atlas**
   - Allez sur [MongoDB Atlas](https://cloud.mongodb.com/)
   - Connectez-vous à votre compte
   - Cliquez sur **"Browse Collections"**

3. **Modifier l'utilisateur**
   - Ouvrez votre base de données (ex: `supfile`)
   - Ouvrez la collection **`users`**
   - Recherchez `<SUPER_ADMIN_EMAIL>`
   - Cliquez sur l'utilisateur → **Edit Document**
   - Ajoutez/modifiez `is_admin: true`
   - Cliquez sur **Update**

4. **Rafraîchir votre session**
   - Déconnectez-vous de l'application
   - Reconnectez-vous avec `<SUPER_ADMIN_EMAIL>`

**C'est terminé !** Le menu "⚙️ Administration" devrait apparaître.

---

## ✅ Vérification

Après la configuration, vérifiez que :

1. Dans MongoDB Atlas, `<SUPER_ADMIN_EMAIL>` a `is_admin: true`
2. Vous êtes déconnecté puis reconnecté dans l'application
3. Le menu affiche "⚙️ Administration"

---

**Recommandation** : Utilisez l'Option 2 (MongoDB Atlas Web UI) car c'est la plus simple et vous voyez immédiatement le résultat.
