# Double Authentification (2FA) - SUPFile

## 📋 Vue d'ensemble

La double authentification (2FA) a été implémentée pour renforcer la sécurité des comptes utilisateurs. Cette fonctionnalité est **optionnelle** et peut être activée par chaque utilisateur dans ses paramètres.

## 🔐 Fonctionnalités

### Backend

#### 1. Modèle utilisateur étendu
- `two_factor_enabled`: Boolean - Indique si le 2FA est activé
- `two_factor_secret`: String - Secret TOTP pour générer les codes
- `two_factor_backup_codes`: Array - Codes de secours (8 codes)

#### 2. Routes API (`/api/2fa`)
- `GET /api/2fa/status` - Récupère le statut 2FA de l'utilisateur
- `POST /api/2fa/setup` - Génère un QR code et des codes de secours
- `POST /api/2fa/verify` - Vérifie le code et active le 2FA
- `POST /api/2fa/disable` - Désactive le 2FA (nécessite le mot de passe)
- `POST /api/2fa/verify-login` - Vérifie le code lors de la connexion

#### 3. Route d'authentification
- `POST /api/auth/verify-2fa-login` - Complète la connexion après vérification 2FA

#### 4. Dépendances
- `speakeasy` - Génération et vérification des codes TOTP
- `qrcode` - Génération des QR codes

### Frontend

#### 1. Page Settings
- Interface complète pour activer/désactiver le 2FA
- Affichage du QR code à scanner
- Affichage des codes de secours
- Formulaire de vérification du code initial
- Formulaire de désactivation avec mot de passe

#### 2. Page Login
- Détection automatique si le 2FA est requis
- Modal de vérification du code 2FA
- Support des codes de secours
- Interface utilisateur intuitive

## 🚀 Utilisation

### Pour l'utilisateur

#### Activation du 2FA

1. Se connecter à SUPFile
2. Aller dans **Paramètres** (⚙️)
3. Scroller jusqu'à la section **Double authentification (2FA)**
4. Cliquer sur **Activer le 2FA**
5. Scanner le QR code avec une application d'authentification :
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - 1Password
   - Etc.
6. **IMPORTANT** : Sauvegarder les 8 codes de secours dans un endroit sûr
7. Entrer le code à 6 chiffres généré par l'application
8. Cliquer sur **Activer**

#### Connexion avec 2FA

1. Entrer email et mot de passe normalement
2. Une interface de vérification 2FA apparaît
3. Ouvrir l'application d'authentification
4. Entrer le code à 6 chiffres
5. Cliquer sur **Vérifier**

#### Utilisation d'un code de secours

Si vous n'avez plus accès à votre application d'authentification :
1. Lors de la connexion, entrer un code de secours au lieu du code TOTP
2. Le code de secours sera consommé et ne pourra plus être utilisé
3. Il vous restera 7 codes de secours

#### Désactivation du 2FA

1. Aller dans **Paramètres**
2. Section **Double authentification (2FA)**
3. Entrer votre mot de passe
4. Cliquer sur **Désactiver le 2FA**

## 🔧 Installation

### Backend

```bash
cd backend
npm install speakeasy qrcode
```

### Configuration

Aucune configuration supplémentaire n'est nécessaire. Le 2FA fonctionne immédiatement après l'installation des dépendances.

## 📊 Sécurité

### Mesures de sécurité implémentées

1. **Secret TOTP** : Stocké de manière sécurisée dans la base de données
2. **Codes de secours** : 8 codes générés aléatoirement (8 caractères hexadécimaux)
3. **Fenêtre de temps** : Les codes TOTP sont valides pendant ±60 secondes (window: 2)
4. **Désactivation protégée** : Nécessite le mot de passe de l'utilisateur
5. **Codes de secours à usage unique** : Chaque code ne peut être utilisé qu'une seule fois

### Bonnes pratiques

1. **Sauvegarder les codes de secours** : Les stocker dans un gestionnaire de mots de passe ou les imprimer
2. **Ne pas partager le secret** : Le QR code et le secret manuel ne doivent jamais être partagés
3. **Utiliser une application fiable** : Privilégier les applications d'authentification reconnues
4. **Régénérer si compromis** : En cas de doute, désactiver et réactiver le 2FA pour obtenir un nouveau secret

## 🧪 Tests

### Test manuel - Activation

1. Créer un compte ou se connecter
2. Aller dans Paramètres
3. Activer le 2FA
4. Scanner le QR code avec Google Authenticator
5. Vérifier que le code fonctionne
6. Se déconnecter
7. Se reconnecter et vérifier que le 2FA est demandé

### Test manuel - Code de secours

1. Activer le 2FA
2. Noter un code de secours
3. Se déconnecter
4. Se reconnecter en utilisant le code de secours
5. Vérifier que la connexion fonctionne
6. Vérifier que le code de secours a été consommé

### Test manuel - Désactivation

1. Activer le 2FA
2. Aller dans Paramètres
3. Désactiver le 2FA avec le mot de passe
4. Se déconnecter
5. Se reconnecter et vérifier que le 2FA n'est plus demandé

## 📝 Notes techniques

### Format TOTP

- **Algorithme** : SHA-1
- **Période** : 30 secondes
- **Longueur du code** : 6 chiffres
- **Fenêtre de tolérance** : ±2 périodes (±60 secondes)

### Stockage

- Le secret TOTP est stocké en base64
- Les codes de secours sont stockés en clair (hexadécimal)
- Aucun chiffrement supplémentaire n'est appliqué (MongoDB gère le chiffrement au repos)

### Compatibilité

- Compatible avec toutes les applications TOTP standard (RFC 6238)
- Fonctionne sur mobile et desktop
- Pas de dépendance à un service tiers

## 🐛 Dépannage

### "Code invalide" lors de l'activation

- Vérifier que l'heure du téléphone est synchronisée
- Attendre quelques secondes et réessayer
- Vérifier que le QR code a été scanné correctement

### "Code invalide" lors de la connexion

- Vérifier l'heure du téléphone
- Essayer avec un code de secours
- Contacter l'administrateur si tous les codes de secours sont épuisés

### Perte d'accès à l'application d'authentification

- Utiliser un code de secours
- Si tous les codes sont épuisés, contacter l'administrateur
- L'administrateur peut désactiver le 2FA manuellement en base de données

## 🔄 Mise à jour

Pour mettre à jour le système 2FA :

```bash
cd backend
npm update speakeasy qrcode
```

## 📚 Ressources

- [RFC 6238 - TOTP](https://tools.ietf.org/html/rfc6238)
- [Speakeasy Documentation](https://github.com/speakeasyjs/speakeasy)
- [QRCode Documentation](https://github.com/soldair/node-qrcode)
