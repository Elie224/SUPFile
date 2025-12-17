/// Validateur d'entrées pour la sécurité côté client
class InputValidator {
  /// Valider un email
  static bool isValidEmail(String email) {
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    return emailRegex.hasMatch(email.trim());
  }

  /// Valider un mot de passe (minimum 8 caractères, majuscule, chiffre)
  static bool isValidPassword(String password) {
    if (password.length < 8) return false;
    if (!password.contains(RegExp(r'[A-Z]'))) return false;
    if (!password.contains(RegExp(r'[0-9]'))) return false;
    return true;
  }

  /// Valider un nom de fichier
  static bool isValidFileName(String fileName) {
    // Exclure les caractères dangereux
    final dangerousChars = RegExp(r'[<>:"/\\|?*\x00-\x1f]');
    if (dangerousChars.hasMatch(fileName)) return false;
    
    // Vérifier la longueur
    if (fileName.isEmpty || fileName.length > 255) return false;
    
    // Exclure les noms réservés Windows
    final reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
    ];
    final nameWithoutExt = fileName.split('.').first.toUpperCase();
    if (reservedNames.contains(nameWithoutExt)) return false;
    
    return true;
  }

  /// Valider un nom de dossier
  static bool isValidFolderName(String folderName) {
    return isValidFileName(folderName);
  }

  /// Sanitizer pour prévenir les injections
  static String sanitizeInput(String input) {
    // Supprimer les caractères de contrôle
    return input.replaceAll(RegExp(r'[\x00-\x1f\x7f]'), '');
  }

  /// Valider la taille d'un fichier
  static bool isValidFileSize(int sizeInBytes, int maxSizeInBytes) {
    return sizeInBytes > 0 && sizeInBytes <= maxSizeInBytes;
  }

  /// Valider un token de partage
  static bool isValidShareToken(String token) {
    // Format attendu : alphanumérique, tirets, underscores, longueur raisonnable
    final tokenRegex = RegExp(r'^[a-zA-Z0-9_-]{20,100}$');
    return tokenRegex.hasMatch(token);
  }
}




