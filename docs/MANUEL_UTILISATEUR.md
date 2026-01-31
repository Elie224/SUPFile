# Manuel utilisateur – SUPFile

Ce manuel présente les fonctionnalités de SUPFile et guide un nouvel utilisateur (web et mobile).

---

## 1. Découverte de l’application

SUPFile est une plateforme de stockage cloud : vous pouvez y stocker des fichiers et dossiers (jusqu’à 30 Go par compte), les organiser, les partager et les consulter depuis le web ou l’application mobile.

- **Application web** : navigateur (Chrome, Firefox, Edge, Safari) sur l’adresse fournie (ex. `http://localhost:3000` ou l’URL de production).
- **Application mobile** : installer l’app SUPFile (APK Android ou build iOS) et l’ouvrir.

---

## 2. Première connexion

### 2.1 Créer un compte

1. Sur la page d’accueil, cliquez sur **« S’inscrire »** (ou **Sign up**).
2. Saisissez votre **adresse e-mail** et un **mot de passe** (au moins 8 caractères, avec une majuscule et un chiffre).
3. Validez l’inscription.
4. Vous êtes connecté et redirigé vers le **tableau de bord**.

Vous pouvez aussi vous connecter avec **Google** ou **GitHub** si l’administrateur a activé ces options.

### 2.2 Se connecter

1. Cliquez sur **« Se connecter »** (ou **Login**).
2. Entrez votre **e-mail** et votre **mot de passe**.
3. Si la double authentification (2FA) est activée sur votre compte, saisissez le code à 6 chiffres de votre application d’authentification.

---

## 3. Tableau de bord

Après connexion, le **tableau de bord** affiche :

- **Espace de stockage** : quota utilisé / 30 Go (barre de progression).
- **Répartition par type** : répartition en Images, Vidéos, Documents, Audio, Autres (graphique et tailles en Go).
- **Fichiers récents** : les 5 derniers fichiers modifiés ou uploadés ; un clic ouvre la prévisualisation. Le bouton **« Voir tout »** mène à la page **Fichiers**.

Sur mobile, le tableau de bord affiche les mêmes informations ; touchez un fichier récent pour l’ouvrir.

---

## 4. Gestion des fichiers et dossiers

### 4.1 Accéder à vos fichiers

- Dans le menu, cliquez sur **« Fichiers »** (ou **Files**).
- Vous voyez la **racine** de votre espace : dossiers et fichiers.
- Le **fil d’Ariane** (Racine / Dossier1 / Dossier2) en haut permet de remonter ; chaque segment est cliquable.
- Cliquez sur un **dossier** pour entrer dedans ; utilisez **« Retour »** ou le fil d’Ariane pour revenir.

### 4.2 Créer un dossier

1. Sur la page Fichiers, cliquez sur **« Nouveau dossier »** (ou équivalent).
2. Saisissez le nom du dossier.
3. Validez. Le dossier apparaît dans la liste.

### 4.3 Uploader des fichiers

- **Web** : glissez-déposez des fichiers dans la zone prévue, ou cliquez sur **« Upload »** et sélectionnez un ou plusieurs fichiers. Une **barre de progression** s’affiche par fichier.
- **Mobile** : utilisez le bouton d’ajout (➕) ou l’option **Upload** du menu pour choisir des fichiers depuis l’appareil.

Les fichiers sont enregistrés dans le dossier actuellement affiché.

### 4.4 Renommer, déplacer, supprimer

- **Web** : menu contextuel ou boutons sur chaque ligne (Renommer, Déplacer, Supprimer). Vous pouvez aussi **glisser-déposer** un fichier ou un dossier sur un dossier pour le déplacer.
- **Mobile** : appui long ou menu (⋮) sur un fichier/dossier, puis choisir Renommer, Déplacer ou Supprimer.

Les éléments supprimés vont dans la **Corbeille** (voir ci-dessous).

### 4.5 Télécharger

- **Fichier** : bouton **« Télécharger »** sur un fichier (ou dans le menu) pour le télécharger sur votre appareil.
- **Dossier** : bouton **« Télécharger (ZIP) »** pour obtenir une archive ZIP du dossier entier, générée à la volée par le serveur.

---

## 5. Prévisualisation

- Cliquez ou touchez un **fichier** (image, PDF, texte, vidéo, audio) pour l’ouvrir en **prévisualisation** sans le télécharger.
- **Images** : affichage direct ; sur le web, galerie des autres images du même dossier.
- **PDF et textes (TXT, MD)** : visionneuse intégrée.
- **Vidéos et audio** : lecture en streaming (barre de progression, pause, volume).
- Un bouton **« Détails techniques »** (ou équivalent) affiche la taille, la date de modification et le type MIME. Un bouton **« Télécharger »** permet de récupérer le fichier.

---

## 6. Recherche et filtres

- Menu **« Recherche »** (ou **Search**).
- Saisissez un **mot-clé** (nom de fichier ou extension, ex. `.pdf`).
- **Filtres** :
  - **Type** : Tous / Fichiers / Dossiers.
  - **Format** : Tous / Images / Vidéos / Audio / Documents (PDF), etc.
  - **Date** : « Modifié entre … et … » ou raccourcis (ex. « La semaine dernière », « Ce mois ») sur le web.
- Les résultats s’affichent ; un clic ouvre le fichier ou le dossier.

---

## 7. Partage et collaboration

### 7.1 Partager par lien (public)

1. Sur un fichier ou un dossier, ouvrez le menu et choisissez **« Partager »**.
2. Créez un **lien public** (optionnel : mot de passe, date d’expiration).
3. Copiez le lien et envoyez-le à qui vous voulez. Toute personne avec le lien peut **télécharger** le fichier ou le dossier (sans avoir de compte), en saisissant le mot de passe si vous en avez défini un.

### 7.2 Partager avec un utilisateur de la plateforme

1. **« Partager »** sur un fichier ou un dossier.
2. Choisissez **« Partager avec un utilisateur »** (partage interne).
3. Recherchez l’utilisateur par e-mail et validez.
4. Le **dossier partagé** apparaît à la **racine** de l’autre utilisateur (section « Partagé avec moi »). Il peut ouvrir et parcourir le contenu en lecture.

---

## 8. Corbeille

- Menu **« Corbeille »** (ou **Trash**).
- Liste des **fichiers et dossiers** supprimés.
- **Restaurer** : bouton ou action « Restaurer » sur un élément pour le remettre dans son emplacement d’origine.
- **Vider la corbeille** : suppression définitive de tout le contenu de la corbeille (action irréversible).

---

## 9. Paramètres du compte

- Menu **« Paramètres »** (ou **Settings**).

### 9.1 Profil

- **Avatar** : clic sur la photo pour en uploader une nouvelle.
- **E-mail** et **Nom d’affichage** : modifiez et enregistrez.

### 9.2 Mot de passe

- Section **« Changer le mot de passe »** : saisissez le mot de passe actuel, le nouveau et la confirmation, puis validez.

### 9.3 Préférences d’interface

- **Thème** : **Clair** ou **Sombre**. Le choix est enregistré et appliqué sur toutes les pages (et synchronisé sur plusieurs appareils si vous êtes connecté avec le même compte).

### 9.4 Double authentification (2FA)

- Vous pouvez **activer** la double authentification pour sécuriser votre compte (code à 6 chiffres via une app type Google Authenticator).
- En **désactivation**, saisissez votre mot de passe et éventuellement un code de secours.

### 9.5 Espace de stockage

- Affichage du **quota utilisé** / 30 Go. Les détails sont aussi visibles sur le tableau de bord.

---

## 10. Accès à un lien de partage (sans compte)

Si quelqu’un vous envoie un **lien de partage** (ex. `https://.../share/abc123`) :

1. Ouvrez le lien dans un navigateur (ou dans l’app mobile si le lien ouvre l’app).
2. Si un **mot de passe** a été défini, saisissez-le.
3. Vous pouvez **prévisualiser** ou **télécharger** le fichier ou le dossier sans créer de compte.

---

## 11. Mode hors ligne (web et mobile)

- **Web** : si vous avez déjà visité des pages en étant connecté, certaines données sont mises en cache ; vous pouvez continuer à naviguer sans connexion (avec des limites). Les opérations en attente sont synchronisées au retour en ligne.
- **Mobile** : l’app peut conserver la session et les données en cache ; les actions effectuées hors ligne (création de dossiers, uploads en attente, etc.) sont synchronisées lorsque la connexion revient.

---

## 12. Récapitulatif des écrans / pages

| Page / écran   | Description courte                                      |
|----------------|---------------------------------------------------------|
| Connexion      | Inscription, connexion (e-mail/mot de passe, OAuth, 2FA).|
| Tableau de bord| Quota, répartition par type, 5 derniers fichiers.      |
| Fichiers       | Arborescence, fil d’Ariane, upload, actions (renommer, déplacer, supprimer, télécharger, partager). |
| Prévisualisation | Visionneuse (image, PDF, texte, vidéo, audio), détails techniques, téléchargement. |
| Recherche      | Recherche par nom/extension, filtres type/format/date.  |
| Corbeille      | Liste des éléments supprimés, restauration, vider.      |
| Partage        | Création de lien public ou partage avec un utilisateur.|
| Paramètres     | Profil (avatar, e-mail, nom), mot de passe, thème, 2FA, quota. |
| Admin          | Réservé aux administrateurs (gestion utilisateurs, etc.). |

---

Pour toute question sur l’installation ou le déploiement, se référer à la **documentation technique** (`docs/INSTALLATION.md`, `docs/API.md`, `README.md`).
