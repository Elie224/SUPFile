# Diagnostic erreur 503 sur Render

## 🔴 Erreur rencontrée
```
GET https://supfile-1.onrender.com/api/auth/google 503 (Service Unavailable)
```

## 🔍 Causes possibles de l'erreur 503

### 1. ⏰ Service endormi (plan gratuit Render)
**Cause la plus fréquente** : Sur le plan gratuit de Render, les services s'endorment après **15 minutes d'inactivité**.

**Symptômes** :
- Le premier appel après l'endormissement prend 30-60 secondes
- Vous obtenez une erreur 503 lors du premier appel

**Solution** :
- Patienter 30-60 secondes après le premier appel
- Utiliser un service de monitoring (uptimerobot, etc.) pour maintenir le service actif
- Passer à un plan payant pour éviter l'endormissement

### 2. ❌ Variables d'environnement OAuth manquantes
**Cause** : Les variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` ne sont pas configurées dans Render.

**Vérification** :
1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Ouvrez votre service `supfile-backend`
3. Allez dans l'onglet **"Environment"**
4. Vérifiez que ces variables existent :
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` = `https://supfile-1.onrender.com/api/auth/google/callback`

**Solution** :
- Si les variables manquent, ajoutez-les (voir [CONFIGURATION_OAUTH_RENDER.md](CONFIGURATION_OAUTH_RENDER.md))
- Redéployez le service après avoir ajouté les variables

### 3. 🗄️ Connexion MongoDB échouée
**Cause** : Si MongoDB n'est pas accessible, le serveur peut démarrer mais échouer sur certaines routes.

**Vérification** :
1. Dans Render, ouvrez les **logs** de votre service
2. Cherchez les erreurs de connexion MongoDB :
   ```
   ❌ MongoDB connection timeout
   ❌ Error connecting to MongoDB
   ```

**Solution** :
- Vérifiez que `MONGO_URI` est correctement configuré dans Render
- Vérifiez que votre MongoDB Atlas/cluster est accessible
- Vérifiez les règles de firewall dans MongoDB Atlas

### 4. 🚫 Le service ne démarre pas
**Cause** : Erreur au démarrage du serveur Node.js.

**Vérification** :
1. Dans Render, ouvrez les **logs** de votre service
2. Cherchez les erreurs de démarrage :
   ```
   Error: Cannot find module
   SyntaxError
   Port already in use
   ```

**Solution** :
- Vérifiez les logs pour identifier l'erreur exacte
- Corrigez le code ou la configuration

### 5. ⏱️ Timeout du build/déploiement
**Cause** : Le build ou le démarrage du service prend trop de temps.

**Solution** :
- Vérifiez les logs de build
- Optimisez les dépendances si nécessaire

---

## 📋 Checklist de diagnostic

### Étape 1 : Vérifier l'état du service
- [ ] Le service est "Live" (vert) dans le dashboard Render
- [ ] Les logs montrent "Server listening on port..."

### Étape 2 : Vérifier les variables d'environnement
- [ ] `GOOGLE_CLIENT_ID` est défini
- [ ] `GOOGLE_CLIENT_SECRET` est défini
- [ ] `GOOGLE_REDIRECT_URI` est défini
- [ ] `MONGO_URI` est défini
- [ ] `SESSION_SECRET` est défini

### Étape 3 : Vérifier les logs
- [ ] Pas d'erreur de connexion MongoDB
- [ ] Pas d'erreur de démarrage
- [ ] Les routes sont bien enregistrées

### Étape 4 : Tester après attente
- [ ] Si le service était endormi, attendre 30-60 secondes
- [ ] Réessayer l'appel après l'attente

---

## 🛠️ Actions de dépannage

### Action 1 : Vérifier les logs Render
1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquez sur votre service `supfile-backend`
3. Ouvrez l'onglet **"Logs"**
4. Cherchez les erreurs récentes

### Action 2 : Vérifier les variables d'environnement
1. Dans Render, ouvrez votre service `supfile-backend`
2. Allez dans l'onglet **"Environment"**
3. Vérifiez que toutes les variables nécessaires sont présentes

### Action 3 : Redéployer le service
1. Dans Render, cliquez sur **"Manual Deploy"** > **"Clear build cache & deploy"**
2. Attendez la fin du déploiement
3. Testez à nouveau

### Action 4 : Tester le endpoint health
Testez d'abord si le service répond :
```
GET https://supfile-1.onrender.com/api/health
```

Si ce endpoint fonctionne mais pas `/api/auth/google`, le problème est spécifique à OAuth.

---

## 📝 Logs à vérifier

### Logs normaux (OK)
```
✅ MongoDB ready, starting server...
SUPFile API listening on http://0.0.0.0:5000
✅ Google OAuth configured
[OAuth google] Configuration OK, initiating authentication...
```

### Logs d'erreur (Problème)
```
❌ MongoDB connection timeout
⚠️  Google OAuth not configured: missing credentials
Error: OAuth google strategy not found in Passport
```

---

## 🔗 Ressources utiles

- [Documentation Render - Troubleshooting](https://render.com/docs/debugging)
- [Configuration OAuth Render](CONFIGURATION_OAUTH_RENDER.md)
- [Diagnostic OAuth](DIAGNOSTIC_OAUTH.md)

---

## ✅ Solution rapide (si service endormi)

Si le service était simplement endormi :
1. Attendez 30-60 secondes après le premier appel
2. Réessayez l'appel
3. Le service devrait répondre normalement

Si le problème persiste, suivez les étapes de diagnostic ci-dessus.
