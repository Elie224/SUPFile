# VARIABLES_ENVIRONNEMENT_FLY_IO

Ce document décrit les variables d'environnement à définir pour SUPFile (Fly.io / Render / Docker).

IMPORTANT
- Ne commitez jamais de secrets (URI MongoDB, JWT_SECRET, SESSION_SECRET, OAuth client secrets, SMTP_PASS, etc.).
- Utilisez des placeholders ici et gérez les vraies valeurs via `flyctl secrets` / variables d'environnement de la plateforme.

## Backend (obligatoire)

- `MONGO_URI` : URI MongoDB (Atlas ou autre)
  - Exemple (placeholder) : `mongodb+srv://[REDACTED]
- `JWT_SECRET` : chaîne aléatoire >= 32 caractères
- `SESSION_SECRET` : chaîne aléatoire >= 32 caractères (différente de JWT_SECRET)
- `FRONTEND_URL` : URL Netlify (ex: `https://supfile.netlify.app`)

## OAuth (si activé)

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## SMTP (si mot de passe oublié)

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## Fly.io (exemples)

```bash
flyctl secrets set --app supfile MONGO_URI="[REDACTED]"
flyctl secrets set --app supfile JWT_SECRET="[REDACTED]"
flyctl secrets set --app supfile SESSION_SECRET="[REDACTED]"
```
