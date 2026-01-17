import 'package:dio/dio.dart';
import 'package:dio_cache_interceptor/dio_cache_interceptor.dart';
import 'package:dio_cache_interceptor_hive_store/dio_cache_interceptor_hive_store.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

/// Cache HTTP pour améliorer les performances
class HttpCache {
  static DioCacheInterceptor? _cacheInterceptor;
  static bool _initialized = false;
  
  /// Initialiser le cache HTTP
  static Future<void> initialize() async {
    if (_initialized) return;
    
    try {
      final directory = await getTemporaryDirectory();
      final cacheStore = HiveCacheStore(
        directory.path,
        hiveBoxName: 'http_cache',
      );
      
      _cacheInterceptor = DioCacheInterceptor(
        options: CacheOptions(
          store: cacheStore,
          policy: CachePolicy.request,
          hitCacheOnErrorExcept: [401, 403],
          maxStale: const Duration(days: 7),
          priority: CachePriority.normal,
          cipher: null,
          keyBuilder: CacheOptions.defaultCacheKeyBuilder,
          allowPostMethod: false,
        ),
      );
      
      _initialized = true;
    } catch (e) {
      // Si le cache échoue, continuer sans cache
      _initialized = false;
    }
  }
  
  /// Obtenir l'intercepteur de cache
  static DioCacheInterceptor? getInterceptor() {
    return _cacheInterceptor;
  }
  
  /// Nettoyer le cache
  static Future<void> clear() async {
    if (_cacheInterceptor != null && _initialized) {
      try {
        final directory = await getTemporaryDirectory();
        final cacheDir = Directory('${directory.path}/http_cache');
        if (await cacheDir.exists()) {
          await cacheDir.delete(recursive: true);
        }
      } catch (e) {
        // Ignorer les erreurs de nettoyage
      }
    }
  }
  
  /// Obtenir la taille du cache
  static Future<int> getCacheSize() async {
    try {
      final directory = await getTemporaryDirectory();
      final cacheDir = Directory('${directory.path}/http_cache');
      if (!await cacheDir.exists()) return 0;
      
      int totalSize = 0;
      await for (final entity in cacheDir.list(recursive: true)) {
        if (entity is File) {
          totalSize += await entity.length();
        }
      }
      return totalSize;
    } catch (e) {
      return 0;
    }
  }
}





