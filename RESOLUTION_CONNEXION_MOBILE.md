# 🔧 Résolution du Problème de Connexion Mobile

## ❌ Erreur Rencontrée
```
SocketException: Connection failed (OS Error: Operation not permitted, errno = 1)
address = 192.168.1.28, port = 5000
```

## ✅ Solutions par Ordre de Priorité

### 1. 🔥 CONFIGURER LE PARE-FEU WINDOWS (PRIORITÉ 1)

Le pare-feu Windows bloque les connexions entrantes sur le port 5000.

**Solution rapide (PowerShell en tant qu'administrateur)** :
```powershell
New-NetFirewallRule -DisplayName "SUPFile Backend Port 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

**Solution manuelle** :
1. Ouvrez "Pare-feu Windows Defender" dans le Panneau de configuration
2. Cliquez sur "Paramètres avancés"
3. Cliquez sur "Règles de trafic entrant" > "Nouvelle règle"
4. Sélectionnez "Port" > Suivant
5. Sélectionnez "TCP" et entrez "5000" > Suivant
6. Sélectionnez "Autoriser la connexion" > Suivant
7. Cochez tous les profils (Domaine, Privé, Public) > Suivant
8. Nommez la règle "SUPFile Backend" > Terminer

### 2. ✅ VÉRIFIER QUE LE BACKEND EST DÉMARRÉ

Dans un terminal PowerShell :
```powershell
cd backend
npm start
```

Vous devriez voir :
```
✓ SUPFile API listening on http://0.0.0.0:5000
```

### 3. 🌐 VÉRIFIER LE RÉSEAU

**Le téléphone et le PC doivent être sur le même réseau Wi-Fi** :
- Vérifiez l'IP de votre PC : `ipconfig` (doit être 192.168.1.28)
- Sur votre téléphone : Paramètres > Wi-Fi > Appuyez sur votre réseau > Vérifiez l'adresse IP
- Les deux doivent être sur le même réseau (192.168.1.x)

### 4. 🧪 TESTER LA CONNEXION

**Depuis le navigateur du téléphone** :
1. Ouvrez Chrome sur votre téléphone Android
2. Allez sur : `http://192.168.1.28:5000/api/health`
3. Si vous voyez une réponse JSON, le backend est accessible
4. Si vous voyez une erreur, le problème vient du pare-feu ou du réseau

**Depuis votre PC** :
```powershell
# Testez si le backend répond
curl http://192.168.1.28:5000/api/health
# ou
Invoke-WebRequest -Uri http://192.168.1.28:5000/api/health
```

### 5. 🔄 REDÉMARRER LE BACKEND

Après avoir configuré le pare-feu, redémarrez le backend :
```powershell
cd backend
npm start
```

### 6. 📱 REBUILD L'APPLICATION (si nécessaire)

Si vous avez modifié la configuration CORS, rebuild l'application :
```powershell
cd mobile-app
flutter build apk --release --dart-define=API_URL=http://192.168.1.28:5000
```

## 🔍 Diagnostic Étape par Étape

### Étape 1 : Vérifier le backend
```powershell
# Dans le terminal backend
cd backend
npm start
```
✅ Le backend doit afficher : `✓ SUPFile API listening on http://0.0.0.0:5000`

### Étape 2 : Tester depuis le PC
```powershell
curl http://192.168.1.28:5000/api/health
```
✅ Doit retourner une réponse JSON

### Étape 3 : Tester depuis le téléphone (navigateur)
1. Ouvrez Chrome sur le téléphone
2. Allez sur `http://192.168.1.28:5000/api/health`
✅ Doit afficher une réponse JSON

### Étape 4 : Configurer le pare-feu
Utilisez la commande PowerShell ci-dessus ou la méthode manuelle

### Étape 5 : Retester depuis le téléphone
Après avoir configuré le pare-feu, retestez depuis le navigateur du téléphone

## ⚠️ Problèmes Courants

### "Connection refused"
- Le backend n'est pas démarré
- Le port 5000 est utilisé par une autre application

### "Operation not permitted"
- **C'est votre cas** : Le pare-feu Windows bloque les connexions
- Solution : Configurer le pare-feu (voir étape 1)

### "Network is unreachable"
- Le téléphone et le PC ne sont pas sur le même réseau Wi-Fi
- Vérifiez les adresses IP

### "Timeout"
- Le backend est trop lent à répondre
- Vérifiez que MongoDB est démarré

## ✅ Checklist Finale

- [ ] Backend démarré sur `http://0.0.0.0:5000`
- [ ] Pare-feu Windows configuré pour autoriser le port 5000
- [ ] Test depuis le navigateur du téléphone fonctionne (`http://192.168.1.28:5000/api/health`)
- [ ] Téléphone et PC sur le même réseau Wi-Fi
- [ ] MongoDB démarré et accessible
- [ ] Application mobile rebuild avec la bonne URL API

## 🚀 Après Correction

Une fois le pare-feu configuré :
1. Redémarrez le backend
2. Testez depuis le navigateur du téléphone
3. Si ça fonctionne, l'application mobile devrait aussi fonctionner
4. Si ça ne fonctionne toujours pas, rebuild l'application mobile

---

**La cause la plus probable est le pare-feu Windows qui bloque le port 5000. Configurez-le d'abord !**




