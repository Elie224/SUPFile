# 🔧 Résolution de l'Erreur "OAuth google is not configured"

## ❌ Problème

L'erreur "OAuth google is not configured" apparaît même après avoir mis à jour les secrets sur Fly.io.

## 🔍 Causes Possibles

1. **Le backend n'a pas été redéployé** après la mise à jour des secrets
2. **Les secrets ne sont pas correctement chargés** par l'application
3. **Les variables d'environnement ne sont pas rechargées** après le redéploiement

---

## ✅ Solution : Vérifier et Redéployer

### Étape 1 : Vérifier les Secrets

Exécutez le script de vérification :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\verifier-oauth-config.ps1
```

Ce script va :
- ✅ Vérifier que tous les secrets OAuth sont configurés
- ✅ Afficher les logs du backend concernant OAuth
- ✅ Identifier les secrets manquants

### Étape 2 : Redéployer le Backend

**Même si vous avez déjà redéployé**, redéployez à nouveau pour vous assurer que les secrets sont bien chargés :

```powershell
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
flyctl deploy --app supfile
```

**Attendez** que le déploiement se termine complètement (2-5 minutes).

### Étape 3 : Vérifier les Logs

Après le redéploiement, vérifiez les logs pour voir si OAuth est bien configuré :

```powershell
flyctl logs --app supfile | Select-String -Pattern "OAuth|Google|configured"
```

**Vous devriez voir** :
- `✅ Google OAuth configured`
- `✅ GitHub OAuth configured`

**Si vous voyez** :
- `⚠️ Google OAuth not configured` → Les secrets ne sont pas chargés

---

## 🔄 Solution Alternative : Redémarrer l'Application

Si le redéploiement ne fonctionne pas, redémarrez l'application :

```powershell
flyctl apps restart supfile
```

---

## 🧪 Test

1. **Attendez** 1-2 minutes après le redéploiement/redémarrage
2. **Allez sur** votre site Netlify
3. **Cliquez sur** "Se connecter avec Google"
4. **Vérifiez** que vous êtes redirigé vers Google (pas d'erreur)

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

### Vérifier les Secrets Manuellement

```powershell
flyctl secrets list --app supfile | Select-String -Pattern "GOOGLE|GITHUB"
```

**Vous devriez voir** :
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### Vérifier les Logs Détaillés

```powershell
flyctl logs --app supfile
```

Cherchez les messages :
- `[OAuth google] Checking configuration...`
- `[OAuth google] Config object:`
- `OAuth google not configured: missing credentials`

### Forcer un Redéploiement Complet

```powershell
# Arrêter l'application
flyctl scale count 0 --app supfile

# Attendre quelques secondes
Start-Sleep -Seconds 5

# Redémarrer
flyctl scale count 1 --app supfile

# Redéployer
flyctl deploy --app supfile
```

---

## 📋 Checklist

- [ ] Secrets vérifiés avec `verifier-oauth-config.ps1`
- [ ] Backend redéployé avec `flyctl deploy`
- [ ] Logs vérifiés (messages "OAuth configured")
- [ ] Application redémarrée si nécessaire
- [ ] Test de connexion Google effectué
- [ ] Test de connexion GitHub effectué

---

## 🎯 Commandes Rapides

```powershell
# Vérifier les secrets
cd C:\Users\KOURO\OneDrive\Desktop\SUPFile\backend
.\verifier-oauth-config.ps1

# Redéployer
flyctl deploy --app supfile

# Vérifier les logs
flyctl logs --app supfile | Select-String -Pattern "OAuth"
```

---

Une fois le backend redéployé et les logs confirmant que OAuth est configuré, l'erreur devrait disparaître ! 🚀
