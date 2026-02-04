# Rendu du projet – SUPFile (section 3 du cahier des charges)

Ce document rappelle les exigences du rendu et où trouver chaque élément dans le dépôt.

---

## Contenu du rendu

Le rendu se fait sous la forme d’une **archive ZIP** contenant :

1. **Code source** : dépôt complet (backend, frontend-web, mobile-app, scripts, etc.)
2. **Assets** : ressources (images, icônes, etc.) incluses dans le dépôt
3. **Documentation technique** : voir ci-dessous
4. **Manuel utilisateur** : `docs/MANUEL_UTILISATEUR.md`

---

## Documentation technique (au minimum)

| Exigence | Emplacement |
|----------|--------------|
| **Procédure d’installation et pré-requis** | `docs/INSTALLATION.md` |
| **Guide de déploiement** | `docs/INSTALLATION.md` (Docker) ; `backend/DEPLOIEMENT_FLY.md` (Fly.io) |
| **Justification des choix technologiques** | `docs/ARCHITECTURE.md` (sections 10 et 11) |
| **Diagrammes UML** | |
| – Cas d’utilisation | `docs/DIAGRAMMES_UML.md` (section 1) |
| – Schéma relationnel / logique BDD | `docs/DIAGRAMMES_UML.md` (section 2) et `docs/DATABASE.md` |
| **Architecture de l’API (endpoints principaux)** | `docs/API.md` ; résumé dans `docs/DIAGRAMMES_UML.md` (section 3) |

---

## Manuel utilisateur

- **Fichier** : `docs/MANUEL_UTILISATEUR.md`
- **Contenu** : présentation des fonctionnalités (web et mobile) et guide pour un nouvel arrivant (connexion, tableau de bord, fichiers, partage, paramètres, etc.).

---

## Règles importantes

### Secrets

- **Aucun secret en clair** : pas de clés API OAuth, mots de passe BDD ou secrets JWT dans le code.
- Tous les secrets sont fournis via **variables d’environnement** (fichier `.env` non versionné).
- Le fichier **`.env.example`** à la racine liste les variables attendues avec des valeurs factices (à remplacer par l’utilisateur).

### Dépôt Git

- Un **dépôt Git** avec un **historique de commits cohérent** doit être fourni et indiqué dans la documentation.
- En l’absence de dépôt Git accessible dans le rendu, le projet ne sera pas corrigé.
- Le dépôt doit rester **privé** jusqu’à la fin du rendu (date d’échéance sur Moodle).
- Il peut être rendu **public** uniquement **après** la date d’échéance du projet.
- Si le dépôt est rendu public avant cette date et qu’un autre groupe réutilise le code, les deux groupes peuvent être sanctionnés.

---

## Barème et conformité

Un document de **conformité au barème** (500 points + bonus/malus) est disponible : **`docs/BAREME_CONFORMITE.md`**. Il relie chaque critère de notation aux parties du projet (serveur, web, mobile) et signale les bonus (glisser-déposer, partage avancé) et les précautions malus (secrets, sécurité).

---

## Vérification rapide avant envoi

- [ ] Archive ZIP générée (code + docs + manuel)
- [ ] Aucun fichier `.env` avec de vrais secrets dans l’archive
- [ ] Documentation technique complète (installation, déploiement, choix techno, UML, API)
- [ ] `docs/MANUEL_UTILISATEUR.md` à jour
- [ ] Dépôt Git accessible (URL fournie dans la doc) et historique cohérent
- [ ] Dépôt Git configuré en **privé** jusqu’à l’échéance

---

Document créé : Décembre 2025
