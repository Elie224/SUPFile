import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Cache de performance pour les données non sensibles
class PerformanceCache {
  static const String _prefix = 'cache_';
  static const Duration _defaultExpiry = Duration(hours: 1);

  /// Sauvegarder des données dans le cache
  static Future<void> set(String key, dynamic value, {Duration? expiry}) async {
    final prefs = await SharedPreferences.getInstance();
    final cacheKey = '$_prefix$key';
    final expiryKey = '${cacheKey}_expiry';
    
    final data = {
      'value': value,
      'timestamp': DateTime.now().toIso8601String(),
    };
    
    await prefs.setString(cacheKey, jsonEncode(data));
    final expiryTime = DateTime.now().add(expiry ?? _defaultExpiry);
    await prefs.setString(expiryKey, expiryTime.toIso8601String());
  }

  /// Récupérer des données du cache
  static Future<T?> get<T>(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final cacheKey = '$_prefix$key';
    final expiryKey = '${cacheKey}_expiry';
    
    final expiryStr = prefs.getString(expiryKey);
    if (expiryStr != null) {
      final expiry = DateTime.parse(expiryStr);
      if (expiry.isBefore(DateTime.now())) {
        // Cache expiré, supprimer
        await prefs.remove(cacheKey);
        await prefs.remove(expiryKey);
        return null;
      }
    }
    
    final dataStr = prefs.getString(cacheKey);
    if (dataStr != null) {
      final data = jsonDecode(dataStr) as Map<String, dynamic>;
      return data['value'] as T?;
    }
    
    return null;
  }

  /// Vérifier si une clé existe dans le cache
  static Future<bool> exists(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final cacheKey = '$_prefix$key';
    return prefs.containsKey(cacheKey);
  }

  /// Supprimer une clé du cache
  static Future<void> remove(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final cacheKey = '$_prefix$key';
    final expiryKey = '${cacheKey}_expiry';
    await prefs.remove(cacheKey);
    await prefs.remove(expiryKey);
  }

  /// Nettoyer tous les caches expirés
  static Future<void> cleanExpired() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys();
    final now = DateTime.now();
    
    for (final key in keys) {
      if (key.startsWith(_prefix) && key.endsWith('_expiry')) {
        final expiryStr = prefs.getString(key);
        if (expiryStr != null) {
          final expiry = DateTime.parse(expiryStr);
          if (expiry.isBefore(now)) {
            final cacheKey = key.replaceAll('_expiry', '');
            await prefs.remove(cacheKey);
            await prefs.remove(key);
          }
        }
      }
    }
  }

  /// Vider tout le cache
  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys();
    
    for (final key in keys) {
      if (key.startsWith(_prefix)) {
        await prefs.remove(key);
      }
    }
  }
}





