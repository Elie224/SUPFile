# 🔧 Accès Alternatif à GitHub OAuth Apps

## ⚠️ Problème : Lien Direct 404

Si le lien direct https://github.com/settings/developers/oauth-apps vous redirige vers une page 404, utilisez cette méthode alternative.

---

## 🎯 Méthode Alternative : Via le Menu Settings

### Étape 1 : Accéder à Settings

1. **Allez sur GitHub** : https://github.com
2. **Connectez-vous** avec votre compte GitHub (si ce n'est pas déjà fait)
3. **Cliquez sur votre photo de profil** en haut à droite de la page
   - C'est l'icône ronde avec votre photo ou votre initiale
4. **Dans le menu déroulant**, cliquez sur **"Settings"**
   - C'est généralement la dernière option dans le menu

### Étape 2 : Accéder à Developer Settings

**Une fois dans Settings**, vous verrez un menu à gauche avec plusieurs options :

```
┌─────────────────────────────────────┐
│ Settings                            │
├─────────────────────────────────────┤
│ Profile                             │
│ Account                              │
│ Appearance                           │
│ Accessibility                        │
│ Notifications                        │
│ Billing                              │
│ ...                                  │
│ Developer settings    ← CLIQUEZ ICI │
│ ...                                  │
└─────────────────────────────────────┘
```

1. **Faites défiler** dans le menu de gauche
2. **Cherchez** "Developer settings" (tout en bas du menu)
3. **Cliquez sur "Developer settings"**

### Étape 3 : Accéder aux OAuth Apps

**Dans la page "Developer settings"**, vous verrez un menu à gauche :

```
┌─────────────────────────────────────┐
│ Developer settings                  │
├─────────────────────────────────────┤
│ Personal access tokens              │
│ Fine-grained tokens                 │
│ OAuth Apps              ← CLIQUEZ ICI│
│ GitHub Apps                          │
│ ...                                  │
└─────────────────────────────────────┘
```

1. **Cliquez sur "OAuth Apps"** dans le menu de gauche
2. **Vous devriez maintenant voir** la liste de vos applications OAuth

---

## 🔍 Si Vous Ne Voyez Pas "Developer settings"

### Option 1 : Vérifier que vous êtes sur le bon compte

1. **Vérifiez** que vous êtes connecté avec le compte GitHub qui a créé l'OAuth App
2. **Si vous avez plusieurs comptes**, déconnectez-vous et reconnectez-vous avec le bon compte

### Option 2 : Vérifier les Permissions

1. **Vérifiez** que votre compte GitHub a les permissions nécessaires
2. **Si vous êtes dans une organisation**, assurez-vous d'avoir les droits d'administration

### Option 3 : Créer une Nouvelle OAuth App

**Si vous ne trouvez pas d'OAuth App existante**, vous pouvez en créer une nouvelle :

1. **Allez dans** : Settings → Developer settings → OAuth Apps
2. **Cliquez sur "New OAuth App"** (ou "Nouvelle application OAuth")
3. **Remplissez le formulaire** :
   - **Application name** : SUPFile (ou un nom de votre choix)
   - **Homepage URL** : `https://supfile.fly.dev`
   - **Authorization callback URL** : `https://supfile.fly.dev/api/auth/github/callback`
4. **Cliquez sur "Register application"**
5. **Notez le Client ID** et **générez un Client Secret**

---

## 🎯 Chemin Complet (Résumé)

1. **GitHub.com** → Photo de profil (en haut à droite) → **Settings**
2. **Settings** → Menu de gauche → **Developer settings** (tout en bas)
3. **Developer settings** → Menu de gauche → **OAuth Apps**

---

## 🔗 Liens Alternatifs à Essayer

Si le chemin ci-dessus ne fonctionne pas, essayez ces liens (en étant connecté à GitHub) :

1. **Settings général** : https://github.com/settings
2. **Developer settings** : https://github.com/settings/apps
3. **OAuth Apps (si accessible)** : https://github.com/settings/developers

---

## 🆘 Si Rien Ne Fonctionne

### Vérifier que l'OAuth App Existe

1. **Vérifiez** dans votre code backend si vous avez bien un `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET`
2. **Si vous avez ces valeurs**, l'OAuth App existe quelque part
3. **Cherchez** dans tous vos comptes GitHub

### Créer une Nouvelle OAuth App

**Si vous ne trouvez vraiment pas l'ancienne OAuth App**, créez-en une nouvelle :

1. **Suivez le chemin** : Settings → Developer settings → OAuth Apps
2. **Cliquez sur "New OAuth App"**
3. **Remplissez** :
   - **Application name** : SUPFile
   - **Homepage URL** : `https://supfile.fly.dev`
   - **Authorization callback URL** : `https://supfile.fly.dev/api/auth/github/callback`
4. **Enregistrez** le Client ID et générez un Client Secret
5. **Mettez à jour** les secrets sur Fly.io avec les nouvelles valeurs

---

## ✅ Une Fois que Vous Avez Accès

Une fois que vous avez accès à la page OAuth Apps :

1. **Trouvez** votre application (ou créez-en une nouvelle)
2. **Cliquez** sur le nom de l'application
3. **Modifiez** "Authorization callback URL" avec : `https://supfile.fly.dev/api/auth/github/callback`
4. **Cliquez** sur "Update application"

---

## 📋 Checklist

- [ ] Connecté à GitHub.com
- [ ] Cliqué sur la photo de profil (en haut à droite)
- [ ] Cliqué sur "Settings"
- [ ] Fait défiler dans le menu de gauche
- [ ] Trouvé "Developer settings" (tout en bas)
- [ ] Cliqué sur "Developer settings"
- [ ] Cliqué sur "OAuth Apps" dans le menu de gauche
- [ ] Page OAuth Apps visible

---

Essayez cette méthode et dites-moi si vous arrivez à accéder à la page OAuth Apps ! 🚀
