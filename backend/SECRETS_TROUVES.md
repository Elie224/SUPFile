# 🔑 Secrets Trouvés dans backend/.env

## Secrets OAuth

### Google OAuth
- **GOOGLE_CLIENT_ID** : `YOUR_GOOGLE_CLIENT_ID`
- **GOOGLE_CLIENT_SECRET** : `YOUR_GOOGLE_CLIENT_SECRET`

### GitHub OAuth
- **GITHUB_CLIENT_ID** : `YOUR_GITHUB_CLIENT_ID`
- **GITHUB_CLIENT_SECRET** : `YOUR_GITHUB_CLIENT_SECRET`

## Secrets JWT (Valeurs de développement)

⚠️ **ATTENTION** : Ces valeurs sont pour le développement. Pour la production, générez de nouvelles valeurs.

- **JWT_SECRET** : `your-super-secret-jwt-key-change-in-production`
- **JWT_REFRESH_SECRET** : `your-super-secret-refresh-key-change-in-production`

## Recommandation

Pour la production, générez de nouveaux secrets JWT avec :

```powershell
# Générer JWT_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Générer JWT_REFRESH_SECRET (exécutez à nouveau)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Générer SESSION_SECRET (exécutez à nouveau)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```
