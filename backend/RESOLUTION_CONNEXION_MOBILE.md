# 🔧 Résolution du Problème de Connexion Mobile

## Problème
L'application mobile ne peut pas se connecter au backend avec l'erreur :
```
SocketException: Connection failed (OS Error: Operation not permitted, errno = 1)
```

## Solutions

### 1. ✅ Vérifier que le backend est démarré

Dans un terminal PowerShell :
```powershell
cd backend
npm start
```

Vous devriez voir :
```
✓ SUPFile API listening on http://0.0.0.0:5000
```

### 2. 🔥 Configurer le Pare-feu Windows

Le pare-feu Windows bloque probablement les connexions entrantes.

**Solution rapide** :
```powershell
# Ouvrir PowerShell en tant qu'administrateur
New-NetFirewallRule -DisplayName "SUPFile Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

**Ou manuellement** :
1. Ouvrez "Pare-feu Windows Defender" dans le Panneau de configuration
2. Cliquez sur "Paramètres avancés"
3. Cliquez sur "Règles de trafic entrant" > "Nouvelle règle"
4. Sélectionnez "Port" > Suivant
5. Sélectionnez "TCP" et entrez "5000" > Suivant
6. Sélectionnez "Autoriser la connexion" > Suivant
7. Cochez tous les profils > Suivant
8. Nommez la règle "SUPFile Backend" > Terminer

### 3. 🌐 Vérifier que le téléphone et le PC sont sur le même réseau Wi-Fi

- Le téléphone doit être connecté au même réseau Wi-Fi que votre PC
- Vérifiez l'IP de votre PC : `ipconfig` (doit être 192.168.1.28)
- Vérifiez l'IP de votre téléphone dans Paramètres > Wi-Fi > Détails

### 4. 🧪 Tester la connexion depuis le téléphone

**Depuis le navigateur du téléphone** :
1. Ouvrez Chrome sur votre téléphone
2. Allez sur : `http://192.168.1.28:5000/api/health` (ou une route simple)
3. Si ça fonctionne, le problème vient de l'application mobile
4. Si ça ne fonctionne pas, le problème vient du réseau/pare-feu

### 5. 🔄 Redémarrer le backend avec l'IP explicite

Parfois, il faut démarrer le backend avec l'IP explicite :

```powershell
cd backend
$env:SERVER_HOST="192.168.1.28"
npm start
```

### 6. 📱 Vérifier la configuration CORS

Le backend doit autoriser les requêtes depuis votre téléphone. Vérifiez que CORS autorise toutes les origines en développement.

## Checklist de Diagnostic

- [ ] Backend démarré et accessible sur `http://192.168.1.28:5000`
- [ ] Pare-feu Windows configuré pour autoriser le port 5000
- [ ] Téléphone et PC sur le même réseau Wi-Fi
- [ ] Test depuis le navigateur du téléphone fonctionne
- [ ] MongoDB est démarré et accessible

## Test Rapide

Depuis votre PC, testez si le backend répond :
```powershell
curl http://192.168.1.28:5000/api/health
```

Si ça fonctionne depuis le PC mais pas depuis le téléphone, c'est un problème de pare-feu ou de réseau.




