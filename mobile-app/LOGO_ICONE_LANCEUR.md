# Instructions pour remplacer l'icône de lanceur Android

Pour remplacer l'icône Flutter par défaut par votre logo "supfile" personnalisé, vous devez remplacer les fichiers `ic_launcher.png` dans les différents dossiers de résolution.

## Emplacements des icônes

Les icônes de lanceur se trouvent dans :
```
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png      (48x48 px)
├── mipmap-hdpi/ic_launcher.png      (72x72 px)
├── mipmap-xhdpi/ic_launcher.png     (96x96 px)
├── mipmap-xxhdpi/ic_launcher.png    (144x144 px)
└── mipmap-xxxhdpi/ic_launcher.png   (192x192 px)
```

## Création des icônes

1. **Créer un logo "supfile"** avec les spécifications suivantes :
   - Fond circulaire avec gradient violet SUPINFO (#502A88 → #6B3FA8)
   - Texte "supfile" en blanc au centre
   - Style moderne et professionnel

2. **Générer les différentes tailles** :
   - **mdpi**: 48x48 px
   - **hdpi**: 72x72 px
   - **xhdpi**: 96x96 px
   - **xxhdpi**: 144x144 px
   - **xxxhdpi**: 192x192 px

3. **Remplacer les fichiers** dans chaque dossier `mipmap-*` avec vos nouvelles icônes.

## Outils recommandés

- **Android Asset Studio** : https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
- **Figma** : Pour créer le design du logo
- **GIMP / Photoshop** : Pour l'édition d'images

## Note

Le logo personnalisé "supfile" est déjà intégré dans l'application elle-même (écrans de connexion, etc.) via le widget `SupFileLogo`. Les icônes de lanceur Android sont uniquement pour l'affichage sur l'écran d'accueil du téléphone.

