import 'package:dio/dio.dart';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'secure_logger.dart';

/// Utilitaires réseau pour la sécurité et la performance
class NetworkUtils {
  /// Vérifier la connectivité réseau
  static Future<bool> hasNetworkConnection() async {
    try {
      final result = await InternetAddress.lookup('google.com');
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  /// Créer un intercepteur de retry avec backoff exponentiel
  static Interceptor createRetryInterceptor({
    required Dio dio,
    int maxRetries = 3,
    Duration baseDelay = const Duration(seconds: 1),
  }) {
    return InterceptorsWrapper(
      onError: (error, handler) async {
        if (error.type == DioExceptionType.connectionTimeout ||
            error.type == DioExceptionType.receiveTimeout ||
            error.type == DioExceptionType.sendTimeout ||
            error.type == DioExceptionType.connectionError) {
          
          final requestOptions = error.requestOptions;
          final retryCount = requestOptions.extra['retryCount'] ?? 0;
          
          if (retryCount < maxRetries) {
            // Backoff exponentiel
            final delay = Duration(
              milliseconds: baseDelay.inMilliseconds * (1 << retryCount),
            );
            
            await Future.delayed(delay);
            
            requestOptions.extra['retryCount'] = retryCount + 1;
            
            try {
              // Réutiliser la même instance Dio pour préserver la configuration
              final response = await dio.fetch(requestOptions);
              return handler.resolve(response);
            } catch (e) {
              // Si la retry échoue, continuer avec l'erreur originale
              SecureLogger.warning('Retry attempt failed', error: e);
            }
          }
        }
        
        return handler.next(error);
      },
    );
  }

  /// Créer un intercepteur de compression
  static Interceptor createCompressionInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) {
        // Éviter Brotli (br) : selon les stacks réseau, la réponse peut ne pas être décodée
        // correctement, ce qui peut provoquer des FormatException lors du parsing JSON.
        // Laisser gzip (supporté largement) suffit.
        if (!kIsWeb) {
          options.headers['Accept-Encoding'] = 'gzip';
        }
        return handler.next(options);
      },
    );
  }

  /// Valider une URL
  static bool isValidUrl(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.hasScheme && (uri.scheme == 'http' || uri.scheme == 'https');
    } catch (_) {
      return false;
    }
  }

  /// Nettoyer les données sensibles des logs
  static String sanitizeForLogging(String data) {
    // Masquer les tokens et mots de passe
    return data
        .replaceAll(RegExp(r'Bearer\s+[\w-]+\.[\w-]+\.[\w-]+'), 'Bearer [REDACTED]')
        .replaceAll(RegExp(r'"password"\s*:\s*"[^"]*"'), '"password": "[REDACTED]"')
        .replaceAll(RegExp(r'"access_token"\s*:\s*"[^"]*"'), '"access_token": "[REDACTED]"')
        .replaceAll(RegExp(r'"refresh_token"\s*:\s*"[^"]*"'), '"refresh_token": "[REDACTED]"');
  }
}

