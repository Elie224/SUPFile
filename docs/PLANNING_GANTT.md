# Planning projet (Diagramme de Gantt) — SUPFile

Periode : **2025-12-10** -> **2026-04-06**

## Equipe et roles

- **Backend** : Nema Elisee Kourouma, Mohamed Koulibaly
- **Base de donnees (MongoDB)** : Idman
- **Securite** : Mahamd Ba
- **Frontend** : partage entre les 4 personnes

## Rythme de suivi (toutes les 2 semaines)

A la fin de chaque quinzaine :
- Resume du travail realise
- Analyse (qualite, risques, blocages)
- Actions correctives
- Plan de la quinzaine suivante

## Diagramme de Gantt (Mermaid)

```mermaid
gantt
    title SUPFile - Planning (10 Dec 2025 -> 06 Apr 2026)
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section Cadrage
    Kickoff :milestone, m0, 2025-12-10, 0d
    Architecture (API, DB, securite) :arch, 2025-12-10, 14d

    section Sprint 1 (10 Dec -> 23 Dec)
    Backend: auth base (signup/login/refresh) [Nema, Mohamed] :s1b, 2025-12-10, 14d
    DB: schemas User/Folder/File [Idman] :s1d, 2025-12-10, 14d
    Frontend: pages auth + base UI [tous] :s1f, 2025-12-10, 14d
    Revue Q1 (resume + analyse) :milestone, r1, 2025-12-24, 0d

    section Sprint 2 (24 Dec -> 06 Jan)
    Backend: folders CRUD + listing [Nema, Mohamed] :s2b, 2025-12-24, 14d
    Frontend: navigation + listing dossiers [tous] :s2f, 2025-12-24, 14d
    Revue Q2 (resume + analyse) :milestone, r2, 2026-01-07, 0d

    section Sprint 3 (07 Jan -> 20 Jan)
    Backend: upload/download fichiers + stockage uploads [Nema, Mohamed] :s3b, 2026-01-07, 14d
    Frontend: upload/download + UX feedback [tous] :s3f, 2026-01-07, 14d
    Revue Q3 (resume + analyse) :milestone, r3, 2026-01-21, 0d

    section Sprint 4 (21 Jan -> 03 Feb)
    Backend: preview/stream (image/pdf/video) [Nema, Mohamed] :s4b, 2026-01-21, 14d
    Frontend: preview (web + mobile) [tous] :s4f, 2026-01-21, 14d
    Revue Q4 (resume + analyse) :milestone, r4, 2026-02-04, 0d

    section Sprint 5 (04 Feb -> 17 Feb)
    Backend: partage public/interne + tokens [Nema, Mohamed] :s5b, 2026-02-04, 14d
    DB: indexes + optimisations requetes [Idman] :s5d, 2026-02-04, 14d
    Frontend: creation + consultation partages [tous] :s5f, 2026-02-04, 14d
    Revue Q5 (resume + analyse) :milestone, r5, 2026-02-18, 0d

    section Sprint 6 (18 Feb -> 03 Mar)
    Securite: headers (CSP), rate-limit, CORS [Mahamd] :s6s, 2026-02-18, 14d
    Backend: 2FA + reset password [Nema, Mohamed] :s6b, 2026-02-18, 14d
    Frontend: ecrans securite + settings [tous] :s6f, 2026-02-18, 14d
    Revue Q6 (resume + analyse) :milestone, r6, 2026-03-04, 0d

    section Sprint 7 (04 Mar -> 17 Mar)
    Backend: dashboard + search + corbeille [Nema, Mohamed] :s7b, 2026-03-04, 14d
    Frontend: dashboard + recherche + corbeille [tous] :s7f, 2026-03-04, 14d
    Revue Q7 (resume + analyse) :milestone, r7, 2026-03-18, 0d

    section Sprint 8 (18 Mar -> 31 Mar)
    Tests + stabilisation (backend/web/mobile) [tous] :s8t, 2026-03-18, 14d
    Documentation (API, UML, installation, rendu) [tous] :s8d, 2026-03-18, 14d
    Revue Q8 (resume + analyse) :milestone, r8, 2026-04-01, 0d

    section Finalisation (01 Apr -> 06 Apr)
    Deploiement (Fly.io/Netlify) + smoke tests [tous] :final, 2026-04-01, 6d
    Livraison finale :milestone, mend, 2026-04-06, 0d
```

## Ressources / technos / outils

- **Backend** : Node.js, Express, Mongoose, JWT + refresh tokens, Passport (OAuth Google/GitHub), Jest
- **Base de donnees** : MongoDB (indexes, relations par ObjectId)
- **Frontend web** : React, Vite, Bootstrap
- **Mobile** : Flutter (Provider/Dio)
- **Securite** : Helmet (CSP/headers), CORS, rate limiting
- **Infra/DevOps** : Docker, Docker Compose, Fly.io (backend), Netlify (web)
- **Qualite** : tests, lint/analyze, revues bimensuelles
