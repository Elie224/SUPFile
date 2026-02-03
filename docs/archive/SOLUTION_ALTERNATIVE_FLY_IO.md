# SOLUTION_ALTERNATIVE_FLY_IO

But : proposer une alternative de déploiement (sans exposer de secrets).

## Principes
- Garder tous les secrets dans `flyctl secrets` (ou variables Render), jamais dans le repo.
- Utiliser des placeholders dans les scripts et la documentation.

## Exemple (placeholder)

- `MONGO_URI` : `mongodb+srv://[REDACTED]
