import 'dart:io';
import 'package:path/path.dart' as path;
import 'input_validator.dart';

/// Utilitaires de sécurité pour les fichiers
class FileSecurity {
  /// Types MIME autorisés (whitelist)
  static const List<String> allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Textes
    'text/plain',
    'text/markdown',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'application/xml',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    // Vidéo
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ];
  
  /// Extensions de fichiers dangereuses (blacklist)
  static const List<String> dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.com',
    '.pif',
    '.scr',
    '.vbs',
    '.js',
    '.jar',
    '.app',
    '.deb',
    '.rpm',
    '.dmg',
    '.sh',
    '.ps1',
    '.msi',
  ];
  
  /// Taille maximale de fichier (30 GB)
  static const int maxFileSize = 32212254720;
  
  /// Taille maximale pour les images (50 MB)
  static const int maxImageSize = 52428800;
  
  /// Taille maximale pour les avatars (5 MB)
  static const int maxAvatarSize = 5242880;
  
  /// Valider un fichier avant l'upload
  static FileValidationResult validateFile(File file) {
    // Vérifier l'existence
    if (!file.existsSync()) {
      return FileValidationResult(
        isValid: false,
        error: 'Le fichier n\'existe pas',
      );
    }
    
    // Vérifier la taille
    final size = file.lengthSync();
    if (size <= 0) {
      return FileValidationResult(
        isValid: false,
        error: 'Le fichier est vide',
      );
    }
    
    if (size > maxFileSize) {
      return FileValidationResult(
        isValid: false,
        error: 'Le fichier est trop volumineux (max: ${_formatSize(maxFileSize)})',
      );
    }
    
    // Vérifier l'extension
    final extension = path.extension(file.path).toLowerCase();
    if (dangerousExtensions.contains(extension)) {
      return FileValidationResult(
        isValid: false,
        error: 'Type de fichier non autorisé',
      );
    }
    
    // Vérifier le nom
    final fileName = path.basename(file.path);
    if (!InputValidator.isValidFileName(fileName)) {
      return FileValidationResult(
        isValid: false,
        error: 'Nom de fichier invalide',
      );
    }
    
    return FileValidationResult(isValid: true);
  }
  
  /// Valider une image avant l'upload
  static FileValidationResult validateImage(File file) {
    final baseValidation = validateFile(file);
    if (!baseValidation.isValid) {
      return baseValidation;
    }
    
    final size = file.lengthSync();
    if (size > maxImageSize) {
      return FileValidationResult(
        isValid: false,
        error: 'L\'image est trop volumineuse (max: ${_formatSize(maxImageSize)})',
      );
    }
    
    final extension = path.extension(file.path).toLowerCase();
    final imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    if (!imageExtensions.contains(extension)) {
      return FileValidationResult(
        isValid: false,
        error: 'Format d\'image non supporté',
      );
    }
    
    return FileValidationResult(isValid: true);
  }
  
  /// Valider un avatar avant l'upload
  static FileValidationResult validateAvatar(File file) {
    final baseValidation = validateImage(file);
    if (!baseValidation.isValid) {
      return baseValidation;
    }
    
    final size = file.lengthSync();
    if (size > maxAvatarSize) {
      return FileValidationResult(
        isValid: false,
        error: 'L\'avatar est trop volumineux (max: ${_formatSize(maxAvatarSize)})',
      );
    }
    
    return FileValidationResult(isValid: true);
  }
  
  /// Formater la taille en format lisible
  static String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(2)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
  
  /// Détecter le type MIME d'un fichier basé sur l'extension
  static String? detectMimeType(String filePath) {
    final extension = path.extension(filePath).toLowerCase();
    final mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
    };
    return mimeMap[extension];
  }
}

/// Résultat de validation d'un fichier
class FileValidationResult {
  final bool isValid;
  final String? error;
  
  FileValidationResult({
    required this.isValid,
    this.error,
  });
}




