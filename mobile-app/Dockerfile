FROM ubuntu:22.04

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    xz-utils \
    zip \
    libglu1-mesa \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Installer Flutter SDK
RUN git clone https://github.com/flutter/flutter.git -b stable /usr/local/flutter
ENV PATH="/usr/local/flutter/bin:/usr/local/flutter/bin/cache/dart-sdk/bin:${PATH}"

# Vérifier l'installation
RUN flutter doctor

WORKDIR /app

# Copier les fichiers de dépendances
COPY pubspec.yaml pubspec.lock ./

# Installer les dépendances Flutter
RUN flutter pub get

# Copier le code source
COPY . .

# Exposer le port pour le développement web
EXPOSE 8080

# Commande par défaut (peut être modifiée selon les besoins)
CMD ["flutter", "run", "-d", "web-server", "--web-port", "8080", "--web-hostname", "0.0.0.0"]
