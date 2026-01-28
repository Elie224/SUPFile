# 📝 Instructions pour Homepage URL - GitHub OAuth

## 🎯 Qu'est-ce que "Homepage URL" ?

Le champ **"Homepage URL"** dans GitHub OAuth App est l'URL de la page d'accueil de votre application. C'est l'URL que les utilisateurs verront quand ils autoriseront votre application.

---

## ✅ Ce que Vous Devez Mettre

### Option 1 : URL du Frontend (Recommandé)

**Mettez l'URL de votre frontend Netlify** :

```
https://flourishing-banoffee-c0b1ad.netlify.app
```

**Pourquoi ?** : C'est l'URL que les utilisateurs utilisent pour accéder à votre application web.

### Option 2 : URL du Backend (Alternative)

Si vous préférez pointer vers le backend :

```
https://supfile.fly.dev
```

**Pourquoi ?** : C'est l'URL de votre API backend.

---

## 🎯 Recommandation

**Je recommande d'utiliser l'URL du frontend** (Option 1) car :
- C'est ce que les utilisateurs voient et utilisent
- C'est plus logique pour une "Homepage URL"
- GitHub affichera cette URL dans l'écran d'autorisation OAuth

---

## 📋 Instructions Détaillées

### Sur la Page GitHub OAuth App

1. **Trouvez le champ "Homepage URL"**
   - Il se trouve généralement **au-dessus** du champ "Authorization callback URL"
   - Actuellement, il contient probablement : `http://localhost:3001`

2. **Cliquez dans le champ "Homepage URL"**

3. **Sélectionnez tout le texte** (Ctrl+A)

4. **Supprimez l'ancienne URL**

5. **Tapez ou copiez-collez** :
   ```
   https://flourishing-banoffee-c0b1ad.netlify.app
   ```
   
   ⚠️ **Important** :
   - Commence par `https://` (pas `http://`)
   - Pas d'espace avant ou après
   - Pas de slash `/` à la fin

6. **Vérifiez** que le champ contient exactement :
   ```
   https://flourishing-banoffee-c0b1ad.netlify.app
   ```

7. **Faites défiler vers le bas** et **cliquez sur "Update application"**

---

## 🔍 Comment Trouver Votre URL Netlify

Si vous ne connaissez pas votre URL Netlify exacte :

1. **Allez sur** : https://app.netlify.com
2. **Connectez-vous** avec votre compte Netlify
3. **Cliquez sur votre site** (probablement `flourishing-banoffee-c0b1ad`)
4. **L'URL de votre site** est affichée en haut de la page
   - Format : `https://[nom-du-site].netlify.app`

---

## 📋 Checklist Complète pour GitHub OAuth

### Homepage URL
- [ ] Champ "Homepage URL" trouvé
- [ ] Cliqué dans le champ
- [ ] Sélectionné tout le texte (Ctrl+A)
- [ ] Supprimé l'ancienne URL : `http://localhost:3001`
- [ ] Ajouté : `https://flourishing-banoffee-c0b1ad.netlify.app`
- [ ] Vérifié qu'il n'y a pas d'erreur (pas d'espace, https:// correct)

### Authorization Callback URL
- [ ] Champ "Authorization callback URL" trouvé
- [ ] Cliqué dans le champ
- [ ] Sélectionné tout le texte (Ctrl+A)
- [ ] Supprimé l'ancienne URL : `http://localhost:5001/api/auth/github/callback`
- [ ] Ajouté : `https://supfile.fly.dev/api/auth/github/callback`
- [ ] Vérifié qu'il n'y a pas d'erreur (pas d'espace, https:// correct)

### Enregistrement
- [ ] Fait défiler vers le bas
- [ ] Cliqué sur "Update application" (bouton vert)
- [ ] Message de confirmation reçu
- [ ] Nouvelles URLs visibles dans les champs

---

## 🎯 URLs Exactes à Utiliser

### Homepage URL
```
https://flourishing-banoffee-c0b1ad.netlify.app
```

### Authorization Callback URL
```
https://supfile.fly.dev/api/auth/github/callback
```

---

## ✅ Une Fois Terminé

Après avoir mis à jour les deux champs :

- ✅ **Homepage URL** pointera vers votre frontend Netlify
- ✅ **Authorization Callback URL** pointera vers votre backend Fly.io
- ✅ **GitHub OAuth** fonctionnera correctement avec votre application déployée

**Prochaine étape** : Mettre à jour Netlify (voir `GUIDE_DETAIL_MISE_A_JOUR.md`)

---

## 🆘 Si Vous Ne Connaissez Pas Votre URL Netlify

1. **Allez sur** : https://app.netlify.com
2. **Connectez-vous**
3. **Cliquez sur votre site**
4. **L'URL est affichée** en haut de la page

Ou vérifiez dans votre fichier `GUIDE_DETAIL_MISE_A_JOUR.md` - l'URL Netlify devrait y être mentionnée.

---

C'est tout ! Mettez à jour les deux champs (Homepage URL et Authorization Callback URL) puis cliquez sur "Update application" ! 🚀
