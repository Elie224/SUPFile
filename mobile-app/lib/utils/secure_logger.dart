import 'package:flutter/foundation.dart';
import 'dart:developer' as developer;

/// Système de logging sécurisé qui ne jamais expose de données sensibles
class SecureLogger {
  static const String _tag = 'SUPFile';
  
  /// Logger sécurisé pour les informations générales
  static void info(String message, {Map<String, dynamic>? data}) {
    if (kDebugMode) {
      final sanitizedData = _sanitizeData(data);
      developer.log(
        message,
        name: _tag,
        level: 800, // INFO level
        error: sanitizedData != null ? sanitizedData.toString() : null,
      );
    }
  }
  
  /// Logger sécurisé pour les warnings
  static void warning(String message, {Map<String, dynamic>? data, Object? error}) {
    if (kDebugMode) {
      final sanitizedData = _sanitizeData(data);
      final sanitizedError = error != null ? _sanitizeString(error.toString()) : null;
      developer.log(
        message,
        name: _tag,
        level: 900, // WARNING level
        error: sanitizedError ?? sanitizedData?.toString(),
      );
    }
  }
  
  /// Logger sécurisé pour les erreurs
  static void error(String message, {Object? error, StackTrace? stackTrace}) {
    if (kDebugMode) {
      final sanitizedError = error != null ? _sanitizeString(error.toString()) : null;
      developer.log(
        message,
        name: _tag,
        level: 1000, // ERROR level
        error: sanitizedError,
        stackTrace: stackTrace,
      );
    }
  }
  
  /// Logger sécurisé pour les requêtes API (sans données sensibles)
  static void apiRequest(String method, String path, {Map<String, dynamic>? headers}) {
    if (kDebugMode) {
      final sanitizedHeaders = headers != null ? _sanitizeHeaders(headers) : null;
      developer.log(
        'API Request: $method $path',
        name: _tag,
        level: 700, // DEBUG level
        error: sanitizedHeaders?.toString(),
      );
    }
  }
  
  /// Logger sécurisé pour les réponses API
  static void apiResponse(String method, String path, int statusCode) {
    if (kDebugMode) {
      developer.log(
        'API Response: $method $path -> $statusCode',
        name: _tag,
        level: 700, // DEBUG level
      );
    }
  }
  
  /// Sanitizer pour les données sensibles
  static Map<String, dynamic>? _sanitizeData(Map<String, dynamic>? data) {
    if (data == null) return null;
    
    final sanitized = <String, dynamic>{};
    final sensitiveKeys = [
      'password',
      'token',
      'access_token',
      'refresh_token',
      'secret',
      'key',
      'authorization',
      'api_key',
      'auth',
    ];
    
    for (final entry in data.entries) {
      final key = entry.key.toLowerCase();
      if (sensitiveKeys.any((sensitive) => key.contains(sensitive))) {
        sanitized[entry.key] = '[REDACTED]';
      } else if (entry.value is Map) {
        sanitized[entry.key] = _sanitizeData(entry.value as Map<String, dynamic>);
      } else if (entry.value is String) {
        sanitized[entry.key] = _sanitizeString(entry.value as String);
      } else {
        sanitized[entry.key] = entry.value;
      }
    }
    
    return sanitized;
  }
  
  /// Sanitizer pour les headers HTTP
  static Map<String, dynamic>? _sanitizeHeaders(Map<String, dynamic> headers) {
    final sanitized = <String, dynamic>{};
    for (final entry in headers.entries) {
      final key = entry.key.toLowerCase();
      if (key == 'authorization' || key.contains('token') || key.contains('auth')) {
        sanitized[entry.key] = '[REDACTED]';
      } else {
        sanitized[entry.key] = entry.value;
      }
    }
    return sanitized;
  }
  
  /// Sanitizer pour les strings
  static String _sanitizeString(String input) {
    return input
        .replaceAll(RegExp(r'Bearer\s+[\w-]+\.[\w-]+\.[\w-]+'), 'Bearer [REDACTED]')
        .replaceAll(RegExp(r'"password"\s*:\s*"[^"]*"'), '"password": "[REDACTED]"')
        .replaceAll(RegExp(r'"access_token"\s*:\s*"[^"]*"'), '"access_token": "[REDACTED]"')
        .replaceAll(RegExp(r'"refresh_token"\s*:\s*"[^"]*"'), '"refresh_token": "[REDACTED]"')
        .replaceAll(RegExp(r'password\s*=\s*[^\s&]+'), 'password=[REDACTED]')
        .replaceAll(RegExp(r'token\s*=\s*[^\s&]+'), 'token=[REDACTED]');
  }
}




