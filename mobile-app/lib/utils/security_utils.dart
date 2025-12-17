import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';

/// Utilitaires de sécurité avancés
class SecurityUtils {
  /// Générer un nonce aléatoire pour protéger contre les replay attacks
  static String generateNonce({int length = 32}) {
    final random = Random.secure();
    final bytes = List<int>.generate(length, (i) => random.nextInt(256));
    return base64Url.encode(bytes);
  }
  
  /// Générer un token CSRF
  static String generateCsrfToken() {
    return generateNonce(length: 32);
  }
  
  /// Hasher un mot de passe avec salt (pour comparaison côté client si nécessaire)
  static String hashPassword(String password, String salt) {
    final bytes = utf8.encode(password + salt);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
  
  /// Générer un salt aléatoire
  static String generateSalt({int length = 16}) {
    final random = Random.secure();
    final bytes = List<int>.generate(length, (i) => random.nextInt(256));
    return base64Url.encode(bytes);
  }
  
  /// Obfuscater une chaîne (pour protéger les tokens en mémoire)
  static String obfuscate(String input) {
    final bytes = utf8.encode(input);
    final obfuscated = bytes.map((b) => b ^ 0xFF).toList();
    return base64Url.encode(obfuscated);
  }
  
  /// Désobfuscater une chaîne
  static String deobfuscate(String obfuscated) {
    final bytes = base64Url.decode(obfuscated);
    final deobfuscated = bytes.map((b) => b ^ 0xFF).toList();
    return utf8.decode(deobfuscated);
  }
  
  /// Valider un token JWT basique (vérifier la structure)
  static bool isValidJwtStructure(String token) {
    final parts = token.split('.');
    return parts.length == 3;
  }
  
  /// Vérifier l'intégrité d'une signature HMAC
  static bool verifyHmac(String data, String signature, String secret) {
    final hmac = Hmac(sha256, utf8.encode(secret));
    final digest = hmac.convert(utf8.encode(data));
    return digest.toString() == signature;
  }
  
  /// Générer une signature HMAC
  static String generateHmac(String data, String secret) {
    final hmac = Hmac(sha256, utf8.encode(secret));
    final digest = hmac.convert(utf8.encode(data));
    return digest.toString();
  }
  
  /// Valider une URL pour prévenir les attaques de redirection
  static bool isValidUrl(String url, {List<String>? allowedDomains}) {
    try {
      final uri = Uri.parse(url);
      if (!uri.hasScheme || (uri.scheme != 'http' && uri.scheme != 'https')) {
        return false;
      }
      
      if (allowedDomains != null && !allowedDomains.contains(uri.host)) {
        return false;
      }
      
      return true;
    } catch (_) {
      return false;
    }
  }
  
  /// Nettoyer les données pour prévenir les injections
  static String sanitizeForDatabase(String input) {
    // Supprimer les caractères de contrôle et les caractères dangereux
    return input
        .replaceAll(RegExp(r'[\x00-\x1f\x7f]'), '')
        .replaceAll(RegExp(r'[<>"]'), '')
        .replaceAll("'", '');
  }
  
  /// Valider la longueur d'une chaîne pour prévenir les DoS
  static bool isValidLength(String input, {int maxLength = 10000}) {
    return input.length <= maxLength;
  }
}

