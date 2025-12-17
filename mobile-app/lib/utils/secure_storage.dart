import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:crypto/crypto.dart';

/// Service de stockage sécurisé pour les données sensibles
/// Utilise flutter_secure_storage pour chiffrer les tokens
/// et SharedPreferences pour les données non sensibles
class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_PKCS1Padding,
      storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // Clés de stockage
  static const String _keyAccessToken = 'access_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUser = 'user';
  static const String _keySessionExpiry = 'session_expiry';

  /// Sauvegarder le token d'accès de manière sécurisée
  static Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _keyAccessToken, value: token);
    // Enregistrer l'heure d'expiration (par défaut 1 heure)
    final expiry = DateTime.now().add(const Duration(hours: 1));
    await _saveSessionExpiry(expiry);
  }

  /// Sauvegarder le refresh token de manière sécurisée
  static Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _keyRefreshToken, value: token);
  }

  /// Récupérer le token d'accès
  static Future<String?> getAccessToken() async {
    // Vérifier l'expiration de la session
    final expiry = await _getSessionExpiry();
    if (expiry != null && expiry.isBefore(DateTime.now())) {
      // Session expirée, supprimer les tokens
      await clearAll();
      return null;
    }
    return await _storage.read(key: _keyAccessToken);
  }

  /// Récupérer le refresh token
  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _keyRefreshToken);
  }

  /// Sauvegarder les données utilisateur (non sensibles, dans SharedPreferences)
  static Future<void> saveUser(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUser, jsonEncode(userData));
  }

  /// Récupérer les données utilisateur
  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(_keyUser);
    if (userJson != null) {
      return jsonDecode(userJson) as Map<String, dynamic>;
    }
    return null;
  }

  /// Vérifier si une session est active
  static Future<bool> hasActiveSession() async {
    final token = await getAccessToken();
    final expiry = await _getSessionExpiry();
    return token != null && expiry != null && expiry.isAfter(DateTime.now());
  }

  /// Mettre à jour l'expiration de la session
  static Future<void> updateSessionExpiry(Duration duration) async {
    final expiry = DateTime.now().add(duration);
    await _saveSessionExpiry(expiry);
  }

  /// Sauvegarder l'expiration de la session
  static Future<void> _saveSessionExpiry(DateTime expiry) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keySessionExpiry, expiry.toIso8601String());
  }

  /// Récupérer l'expiration de la session
  static Future<DateTime?> _getSessionExpiry() async {
    final prefs = await SharedPreferences.getInstance();
    final expiryStr = prefs.getString(_keySessionExpiry);
    if (expiryStr != null) {
      return DateTime.parse(expiryStr);
    }
    return null;
  }

  /// Supprimer tous les tokens et données sensibles
  static Future<void> clearAll() async {
    await _storage.deleteAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyUser);
    await prefs.remove(_keySessionExpiry);
  }

  /// Générer un hash pour les données sensibles
  static String hashData(String data) {
    final bytes = utf8.encode(data);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Vérifier l'intégrité des données
  static bool verifyHash(String data, String hash) {
    return hashData(data) == hash;
  }
}

