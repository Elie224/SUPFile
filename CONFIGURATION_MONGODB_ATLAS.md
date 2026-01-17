# Configuration MongoDB Atlas pour SUPFile

## Étape 1 : Créer un compte (2 minutes)

1. Allez sur https://www.mongodb.com/cloud/atlas/register
2. Créez un compte (gratuit)
3. Vérifiez votre email si nécessaire

## Étape 2 : Créer un cluster gratuit (3 minutes)

1. Une fois connecté, cliquez sur **"Build a Database"**
2. Choisissez le plan **"FREE" (M0)** - c'est gratuit !
3. Sélectionnez :
   - **Cloud Provider** : AWS (ou celui de votre choix)
   - **Region** : Choisissez la région la plus proche (ex: `eu-west-1` pour l'Europe)
4. Cliquez sur **"Create"**
5. ⏳ Attendez 3-5 minutes que le cluster soit créé

## Étape 3 : Créer un utilisateur de base de données (2 minutes)

1. Dans le menu de gauche, allez dans **"Database Access"**
2. Cliquez sur **"Add New Database User"**
3. Choisissez **"Password"** comme méthode d'authentification
4. Créez un utilisateur :
   - **Username** : `supfile-user` (ou ce que vous voulez)
   - **Password** : Cliquez sur "Autogenerate Secure Password" ou créez-en un fort
   - ⚠️ **IMPORTANT** : Notez le mot de passe quelque part, vous en aurez besoin !
5. Dans "Database User Privileges", sélectionnez **"Atlas admin"** (ou "Read and write to any database")
6. Cliquez sur **"Add User"**

## Étape 4 : Autoriser l'accès réseau (1 minute)

1. Dans le menu de gauche, allez dans **"Network Access"**
2. Cliquez sur **"Add IP Address"**
3. Pour le développement/production, vous avez deux options :

   **Option A : Autoriser toutes les IP (plus simple pour débuter)**
   - Cliquez sur **"Allow Access from Anywhere"**
   - Cela ajoute `0.0.0.0/0`
   - ⚠️ Moins sécurisé mais fonctionne partout

   **Option B : Autoriser seulement Render (plus sécurisé)**
   - Cliquez sur "Add Current IP Address" pour votre IP locale
   - Ajoutez les IP de Render (vous pouvez les trouver dans les logs Render)
   - Ou utilisez `0.0.0.0/0` temporairement

4. Cliquez sur **"Confirm"**

## Étape 5 : Obtenir la chaîne de connexion (2 minutes)

1. Dans le menu de gauche, allez dans **"Database"**
2. Cliquez sur **"Connect"** sur votre cluster
3. Choisissez **"Connect your application"**
4. Sélectionnez :
   - **Driver** : `Node.js`
   - **Version** : `5.5 or later` (ou la dernière)
5. Copiez la chaîne de connexion qui ressemble à :
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Remplacez** dans cette chaîne :
   - `<username>` par votre nom d'utilisateur (ex: `supfile-user`)
   - `<password>` par votre mot de passe
   - Ajoutez le nom de la base de données à la fin : `/supfile`
   
   **Exemple final** :
   ```
   mongodb+srv://supfile-user:VotreMotDePasse123@cluster0.xxxxx.mongodb.net/supfile?retryWrites=true&w=majority
   ```

## Étape 6 : Tester la connexion (optionnel)

Vous pouvez tester la connexion avec cette commande Node.js :

```javascript
const mongoose = require('mongoose');

mongoose.connect('VOTRE_CHAINE_DE_CONNEXION')
  .then(() => console.log('✅ Connecté à MongoDB Atlas'))
  .catch(err => console.error('❌ Erreur:', err));
```

## ✅ C'est prêt !

Vous avez maintenant :
- ✅ Un cluster MongoDB gratuit
- ✅ Un utilisateur de base de données
- ✅ L'accès réseau configuré
- ✅ Une chaîne de connexion

**Prochaine étape** : Utilisez cette chaîne de connexion comme valeur de `MONGO_URI` dans Render !

## 📝 Notes importantes

1. **Plan gratuit** : 
   - 512 MB de stockage
   - Parfait pour le développement et les petits projets
   - Si vous dépassez, vous recevrez un email

2. **Sécurité** :
   - Ne partagez jamais votre mot de passe
   - Ne commitez jamais la chaîne de connexion dans Git
   - Utilisez les variables d'environnement dans Render

3. **Performance** :
   - Le cluster gratuit peut être un peu lent au démarrage
   - Parfait pour tester et développer

## 🆘 Problèmes courants

### "IP not whitelisted"
- Vérifiez que vous avez ajouté `0.0.0.0/0` dans Network Access

### "Authentication failed"
- Vérifiez que le nom d'utilisateur et le mot de passe sont corrects dans la chaîne de connexion
- Assurez-vous d'avoir encodé les caractères spéciaux dans le mot de passe (ex: `@` devient `%40`)

### "Connection timeout"
- Vérifiez que le cluster est bien démarré (status "Running")
- Vérifiez votre connexion internet


