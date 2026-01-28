# 📸 Instructions Basées sur Votre Écran - Google OAuth

## ✅ Vous êtes sur la Bonne Page !

D'après votre capture d'écran, vous êtes sur la page de configuration de votre OAuth Client dans Google Cloud Console.

**Page actuelle** : Configuration de l'OAuth Client pour "Client Web 1"
**Projet** : fylora

---

## 🎯 Action Immédiate : Ajouter le Redirect URI

### Étape 1 : Trouver la Section "URI de redirection autorisés"

**Sur votre écran**, vous devriez voir une section intitulée :

```
URI de redirection autorisés
À utiliser avec les requêtes provenant d'un serveur Web
```

**Actuellement, vous avez** :
- **URI 1** : `https://fylora-1.onrender.com/api/auth/google/callback`
- **URI 2** : `http://localhost:5001/api/auth/google/callback`

### Étape 2 : Cliquer sur "+ Ajouter un URI"

1. **Regardez en dessous** des deux URIs existants
2. **Vous verrez un bouton bleu** avec le texte **"+ Ajouter un URI"**
3. **Cliquez sur ce bouton**

### Étape 3 : Ajouter la Nouvelle URL

**Après avoir cliqué sur "+ Ajouter un URI"** :

1. **Un nouveau champ vide apparaîtra** (probablement "URI 3 *")
2. **Cliquez dans ce champ**
3. **Tapez ou copiez-collez exactement** :
   ```
   https://supfile.fly.dev/api/auth/google/callback
   ```

   ⚠️ **Important** :
   - Commence par `https://` (pas `http://`)
   - Pas d'espace avant ou après
   - Exactement comme écrit ci-dessus

4. **Vous devriez maintenant avoir 3 URIs** :
   - URI 1 : `https://fylora-1.onrender.com/api/auth/google/callback`
   - URI 2 : `http://localhost:5001/api/auth/google/callback`
   - URI 3 : `https://supfile.fly.dev/api/auth/google/callback` ← **NOUVEAU**

### Étape 4 : Enregistrer les Modifications

1. **Faites défiler vers le bas** de la page
2. **Vous verrez deux boutons** en bas :
   - **"Enregistrer"** (bouton bleu) ← Cliquez ici
   - **"Annuler"** (bouton blanc)

3. **Cliquez sur "Enregistrer"**

### Étape 5 : Vérification

**Après avoir cliqué sur "Enregistrer"** :

1. **Un message de confirmation** devrait apparaître en haut de la page
2. **La page devrait se recharger** légèrement
3. **Vérifiez** que la nouvelle URI apparaît toujours dans la liste :
   ```
   URI de redirection autorisés
   ┌─────────────────────────────────────────────────┐
   │ URI 1: https://fylora-1.onrender.com/api/...   │
   │ URI 2: http://localhost:5001/api/auth/...      │
   │ URI 3: https://supfile.fly.dev/api/auth/...    │ ← NOUVEAU
   └─────────────────────────────────────────────────┘
   ```

---

## 📋 Checklist Rapide

- [ ] Section "URI de redirection autorisés" visible
- [ ] Bouton "+ Ajouter un URI" trouvé
- [ ] Cliqué sur "+ Ajouter un URI"
- [ ] Nouveau champ "URI 3" apparu
- [ ] Ajouté : `https://supfile.fly.dev/api/auth/google/callback`
- [ ] Vérifié qu'il n'y a pas d'erreur (pas d'espace, https:// correct)
- [ ] Fait défiler vers le bas
- [ ] Cliqué sur "Enregistrer"
- [ ] Message de confirmation reçu
- [ ] Nouvelle URI visible dans la liste

---

## 🎯 URL Exacte à Copier-Coller

```
https://supfile.fly.dev/api/auth/google/callback
```

**Copiez cette URL** et collez-la dans le nouveau champ "URI 3" qui apparaîtra après avoir cliqué sur "+ Ajouter un URI".

---

## ✅ Une Fois Terminé

Après avoir suivi ces étapes :

- ✅ **Google OAuth** acceptera maintenant les redirections depuis `https://supfile.fly.dev`
- ✅ **Votre application** pourra utiliser l'authentification Google avec le nouveau backend Fly.io

**Prochaine étape** : Faire la même chose pour GitHub OAuth (voir le guide GitHub dans `GUIDE_LIENS_DIRECTS_OAUTH.md`)

---

## 🆘 Si Vous Avez un Problème

### Le bouton "+ Ajouter un URI" ne fonctionne pas
- Essayez de rafraîchir la page (F5)
- Vérifiez que vous êtes bien connecté à Google Cloud Console

### L'URI n'apparaît pas après avoir cliqué sur "Enregistrer"
- Vérifiez qu'il n'y a pas d'erreur de format (espaces, http:// au lieu de https://)
- Réessayez en supprimant et réajoutant l'URI

### Vous ne voyez pas la section "URI de redirection autorisés"
- Faites défiler vers le bas de la page
- Elle se trouve en dessous de "Origines JavaScript autorisées"
