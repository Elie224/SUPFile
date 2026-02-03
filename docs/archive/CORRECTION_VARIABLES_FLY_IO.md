# CORRECTION_VARIABLES_FLY_IO

Ce guide corrige/standardise la configuration des variables Fly.io.

## Commandes (placeholders)

```bash
flyctl secrets set --app supfile MONGO_URI="[REDACTED]"
flyctl secrets set --app supfile JWT_SECRET="[REDACTED]"
flyctl secrets set --app supfile SESSION_SECRET="[REDACTED]"
flyctl secrets set --app supfile GOOGLE_CLIENT_SECRET="[REDACTED]"
flyctl secrets set --app supfile GITHUB_CLIENT_SECRET="[REDACTED]"
```

## Notes
- Ne mettez jamais d'URI MongoDB complète avec user/pass dans un fichier versionné.
