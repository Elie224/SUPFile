# 📸 Instructions Basées sur Votre Écran - GitHub OAuth

## ✅ Vous êtes sur la Bonne Page !

D'après votre capture d'écran, vous êtes sur la page "Edit OAuth App" pour l'application "Fylora".

**Page actuelle** : Configuration de l'OAuth App "Fylora"
**URL** : `https://github.com/settings/applications/3305931`

---

## 🎯 Action Immédiate : Modifier l'Authorization Callback URL

### Étape 1 : Trouver le Champ "Authorization callback URL"

**Sur votre écran**, vous devriez voir un champ intitulé :

```
Authorization callback URL
```

**Actuellement, ce champ contient** :
```
http://localhost:5001/api/auth/github/callback
```

### Étape 2 : Modifier le Champ

1. **Cliquez dans le champ "Authorization callback URL"**
   - Le texte actuel sera sélectionné automatiquement
   - Ou sélectionnez tout avec **Ctrl+A** (Windows) ou **Cmd+A** (Mac)

2. **Supprimez l'ancienne URL** :
   - Appuyez sur **Suppr** ou **Backspace**
   - Le champ devrait être vide maintenant

3. **Tapez ou copiez-collez exactement** :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```

   ⚠️ **Important** :
   - Commence par `https://` (pas `http://`)
   - Pas d'espace avant ou après
   - Exactement comme écrit ci-dessus
   - Pas de slash `/` à la fin (sauf après `callback`)

4. **Vérifiez** que le champ contient exactement :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```

### Étape 3 : Enregistrer les Modifications

1. **Faites défiler vers le bas** de la page

2. **Vous verrez un bouton vert** avec le texte **"Update application"**

3. **Cliquez sur "Update application"**

### Étape 4 : Vérification

**Après avoir cliqué sur "Update application"** :

1. **Un message de confirmation** devrait apparaître en haut de la page
   - "Application updated" ou "Application mise à jour"
   - En vert ou avec une icône de succès

2. **La page devrait se recharger** légèrement

3. **Vérifiez** que le champ "Authorization callback URL" affiche maintenant :
   ```
   https://supfile.fly.dev/api/auth/github/callback
   ```

---

## 📋 Checklist Rapide

- [ ] Champ "Authorization callback URL" trouvé
- [ ] Cliqué dans le champ
- [ ] Sélectionné tout le texte (Ctrl+A)
- [ ] Supprimé l'ancienne URL : `http://localhost:5001/api/auth/github/callback`
- [ ] Ajouté : `https://supfile.fly.dev/api/auth/github/callback`
- [ ] Vérifié qu'il n'y a pas d'erreur (pas d'espace, https:// correct)
- [ ] Fait défiler vers le bas
- [ ] Cliqué sur "Update application" (bouton vert)
- [ ] Message de confirmation reçu
- [ ] Nouvelle URL visible dans le champ

---

## 🎯 URL Exacte à Copier-Coller

```
https://supfile.fly.dev/api/auth/github/callback
```

**Copiez cette URL** et collez-la dans le champ "Authorization callback URL" après avoir supprimé l'ancienne URL.

---

## ⚠️ Note sur le Client ID

**Important** : Votre Client ID est `Ov231iHlxn1IFFA0hIkJ`, mais dans votre fichier `.env` vous avez peut-être un autre Client ID (`Ov23ligHjSi2qTjUNtCc`).

**Si les Client IDs ne correspondent pas** :
- Vérifiez que vous utilisez le bon OAuth App
- Ou mettez à jour les secrets sur Fly.io avec le Client ID et Secret de cette application "Fylora"

---

## ✅ Une Fois Terminé

Après avoir suivi ces étapes :

- ✅ **GitHub OAuth** acceptera maintenant les redirections depuis `https://supfile.fly.dev`
- ✅ **Votre application** pourra utiliser l'authentification GitHub avec le nouveau backend Fly.io

**Prochaine étape** : Mettre à jour Netlify (voir `GUIDE_DETAIL_MISE_A_JOUR.md`)

---

## 🆘 Si Vous Avez un Problème

### Le bouton "Update application" ne fonctionne pas
- Vérifiez que l'URL est bien au format `https://` (pas `http://`)
- Vérifiez qu'il n'y a pas d'espace avant ou après l'URL
- Essayez de rafraîchir la page (F5) et réessayez

### L'URL n'apparaît pas après avoir cliqué sur "Update application"
- Vérifiez qu'il n'y a pas d'erreur de format
- Rafraîchissez la page (F5)
- Vérifiez que vous avez bien cliqué sur "Update application"

---

C'est tout ! Modifiez le champ et cliquez sur "Update application" ! 🚀
