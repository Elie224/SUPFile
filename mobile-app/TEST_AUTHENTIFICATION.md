# 🧪 Test Authentifications - SUPFile Mobile

## 📋 Tests à Effectuer

### ✅ Test 1 : Connexion/Inscription Classique (Email/Password)
**Objectif** : Vérifier que l'authentification basique fonctionne

**Étapes** :
1. Ouvrir l'application SUPFile
2. Cliquer sur "Inscription"
3. Remplir le formulaire :
   - Email : `test@example.com`
   - Mot de passe : `Test1234!`
   - Confirmer le mot de passe : `Test1234!`
4. Cliquer sur "Inscription"
5. **Résultat attendu** : ✅ Redirection vers Dashboard
6. Déconnexion
7. Cliquer sur "Connexion"
8. Saisir l'email et le mot de passe créés
9. **Résultat attendu** : ✅ Connexion réussie → Dashboard

**✅ Si réussi** : Authentification classique fonctionne

---

### ✅ Test 2 : Google OAuth (Connexion avec Google)
**Objectif** : Vérifier que Google Sign-In natif fonctionne

**Étapes** :
1. Sur l'écran de connexion, cliquer sur **"Continuer avec Google"**
2. **Résultat attendu** :
   - ✅ Google Sign-In natif s'ouvre
   - ✅ Liste des comptes Google disponibles
   - ✅ Sélectionner un compte Google
   - ✅ Connexion réussie → Redirection vers Dashboard

**❌ Si erreur "DEVELOPER_ERROR"** :
- Le SHA-1 n'est pas configuré dans Google Cloud Console
- **Solution** : Voir section "Configuration Google OAuth" ci-dessous

**❌ Si erreur réseau** :
- Vérifier la connexion internet
- Vérifier que l'API backend est en ligne : `https://supfile-1.onrender.com/health`

**✅ Si réussi** : Google OAuth fonctionne

---

### ✅ Test 3 : GitHub OAuth (Connexion avec GitHub)
**Objectif** : Vérifier que GitHub OAuth avec deep links fonctionne

**Étapes** :
1. Sur l'écran de connexion, cliquer sur **"Continuer avec GitHub"**
2. Le navigateur s'ouvre avec la page GitHub
3. S'authentifier sur GitHub
4. GitHub redirige vers le backend
5. Le backend redirige vers `supfile://oauth/github/callback?token=...`
6. L'application mobile capte le deep link
7. **Résultat attendu** : ✅ Connexion réussie → Dashboard

**⚠️ Note** : L'APK actuel n'a peut-être pas les deep links configurés. Si le deep link ne fonctionne pas :
- L'app ne capte pas la redirection
- Il faudra régénérer l'APK avec les corrections deep links

**✅ Si réussi** : GitHub OAuth fonctionne

---

## 🔧 Configuration Google OAuth (si nécessaire)

### Si erreur "DEVELOPER_ERROR" lors du test Google OAuth :

1. **Obtenir le SHA-1 du keystore debug** :
   ```powershell
   keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   Chercher la ligne : `SHA1: XX:XX:XX:...`

2. **Configurer dans Google Cloud Console** :
   - Aller sur : https://console.cloud.google.com/apis/credentials
   - Sélectionner le projet OAuth SUPFile
   - Dans "OAuth 2.0 Client IDs", trouver le Client ID Android
   - Cliquer sur le Client ID pour l'éditer
   - Vérifier/ajouter :
     - **Package name** : `com.example.supfile_mobile`
     - **SHA-1 certificate fingerprint** : [le SHA-1 obtenu ci-dessus]
   - Sauvegarder
   - **⚠️ Important** : Attendre 5-10 minutes pour la propagation

3. **Réessayer le test Google OAuth**

---

## 📱 Installation de l'APK pour Test

### Option A : Transfert Manuel (Recommandé)

1. **Transférer `app-release.apk`** :
   - Copier depuis : `C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app\build\app\outputs\flutter-apk\app-release.apk`
   - Transférer sur votre téléphone (USB, email, cloud, etc.)

2. **Installer sur le téléphone** :
   - Ouvrir le gestionnaire de fichiers
   - Trouver `app-release.apk`
   - Taper dessus pour installer
   - Autoriser l'installation depuis "Sources inconnues" si demandé

3. **Désinstaller l'ancienne version** (si présente) :
   - Settings → Apps → SUPFile → Uninstall

### Option B : Via USB (ADB)

```powershell
# Connecter le téléphone via USB
# Activer le débogage USB dans les paramètres
adb install C:\Users\KOURO\OneDrive\Desktop\SUPFile\mobile-app\build\app\outputs\flutter-apk\app-release.apk
```

---

## ✅ Checklist de Test

- [ ] **Test 1** : Inscription avec email/password → ✅/❌
- [ ] **Test 1** : Connexion avec email/password → ✅/❌
- [ ] **Test 2** : Google OAuth → ✅/❌
  - [ ] Google Sign-In s'ouvre → ✅/❌
  - [ ] Sélection du compte → ✅/❌
  - [ ] Connexion réussie → ✅/❌
- [ ] **Test 3** : GitHub OAuth → ✅/❌
  - [ ] Navigateur s'ouvre → ✅/❌
  - [ ] Authentification GitHub → ✅/❌
  - [ ] Deep link capté → ✅/❌
  - [ ] Connexion réussie → ✅/❌

---

## 🐛 Erreurs Communes et Solutions

### Erreur : "Network error" ou "Connection failed"

**Cause** : L'application ne peut pas se connecter au backend

**Solution** :
1. Vérifier la connexion internet du téléphone
2. Vérifier que l'API est en ligne : `https://supfile-1.onrender.com/health`
3. Vérifier que l'application utilise bien `https://supfile-1.onrender.com` (pas `localhost`)

### Erreur : "DEVELOPER_ERROR" (Google OAuth)

**Cause** : SHA-1 non configuré dans Google Cloud Console

**Solution** : Voir section "Configuration Google OAuth" ci-dessus

### Erreur : "Invalid credentials" (Connexion classique)

**Cause** : Email ou mot de passe incorrect

**Solution** : Vérifier les identifiants ou créer un nouveau compte

### Erreur : Deep link GitHub ne fonctionne pas

**Cause** : L'APK actuel n'a peut-être pas les deep links configurés

**Solution** : Régénérer l'APK avec les corrections deep links après avoir validé Google OAuth

---

## 📊 Résultats Attendus

### Si TOUS les tests réussissent ✅ :
- ✅ Authentification classique : **FONCTIONNE**
- ✅ Google OAuth : **FONCTIONNE**
- ✅ GitHub OAuth : **FONCTIONNE** (ou à améliorer selon deep links)

**Prochaine étape** : Générer l'APK release final avec toutes les corrections

### Si certains tests échouent ❌ :
- Analyser l'erreur spécifique
- Corriger la configuration (ex: SHA-1 pour Google)
- Réessayer le test

---

**Date** : Janvier 2025
