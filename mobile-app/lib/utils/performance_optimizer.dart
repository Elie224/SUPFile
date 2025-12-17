import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'dart:async';

/// Optimiseur de performance pour réduire les calculs redondants
class PerformanceOptimizer {
  // Cache pour les calculs coûteux
  static final Map<String, dynamic> _computationCache = {};
  static final Map<String, DateTime> _cacheTimestamps = {};
  static const Duration _cacheExpiry = Duration(minutes: 5);
  
  /// Memoization pour les fonctions coûteuses
  static T? memoize<T>(String key, T Function() computation, {Duration? expiry}) {
    final now = DateTime.now();
    final cacheTime = _cacheTimestamps[key];
    
    // Vérifier si le cache est valide
    if (cacheTime != null && 
        now.difference(cacheTime) < (expiry ?? _cacheExpiry)) {
      return _computationCache[key] as T?;
    }
    
    // Calculer et mettre en cache
    final result = computation();
    _computationCache[key] = result;
    _cacheTimestamps[key] = now;
    
    return result;
  }
  
  /// Nettoyer le cache expiré
  static void cleanExpiredCache() {
    final now = DateTime.now();
    final expiredKeys = <String>[];
    
    for (final entry in _cacheTimestamps.entries) {
      if (now.difference(entry.value) >= _cacheExpiry) {
        expiredKeys.add(entry.key);
      }
    }
    
    for (final key in expiredKeys) {
      _computationCache.remove(key);
      _cacheTimestamps.remove(key);
    }
  }
  
  /// Vider tout le cache
  static void clearCache() {
    _computationCache.clear();
    _cacheTimestamps.clear();
  }
  
  /// Debounce amélioré avec annulation
  static Timer? debounce(
    String key,
    Duration delay,
    VoidCallback action,
  ) {
    final existingTimer = _debounceTimers[key];
    existingTimer?.cancel();
    
    final timer = Timer(delay, () {
      action();
      _debounceTimers.remove(key);
    });
    
    _debounceTimers[key] = timer;
    return timer;
  }
  
  static final Map<String, Timer> _debounceTimers = {};
  
  /// Throttle pour limiter l'exécution
  static bool throttle(String key, Duration delay) {
    final lastExecution = _throttleTimestamps[key];
    final now = DateTime.now();
    
    if (lastExecution == null || now.difference(lastExecution) >= delay) {
      _throttleTimestamps[key] = now;
      return true;
    }
    
    return false;
  }
  
  static final Map<String, DateTime> _throttleTimestamps = {};
}

/// Extension pour optimiser les listes
extension ListPerformanceExtension<T> on List<T> {
  /// Obtenir une sous-liste optimisée pour l'affichage
  List<T> getOptimizedSublist(int start, int end) {
    final actualEnd = end > length ? length : end;
    if (start >= actualEnd) return [];
    return sublist(start, actualEnd);
  }
  
  /// Trier de manière optimisée
  List<T> optimizedSort(int Function(T, T) compare) {
    final sorted = List<T>.from(this);
    sorted.sort(compare);
    return sorted;
  }
}

/// Widget optimisé pour réduire les rebuilds
class OptimizedBuilder extends StatelessWidget {
  final Widget Function(BuildContext) builder;
  final List<Object?> keys;
  
  const OptimizedBuilder({
    super.key,
    required this.builder,
    required this.keys,
  });
  
  @override
  Widget build(BuildContext context) {
    return builder(context);
  }
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is OptimizedBuilder &&
        keys.length == other.keys.length &&
        keys.length == other.keys.length &&
        keys.every((key) => other.keys.contains(key));
  }
  
  @override
  int get hashCode => Object.hashAll(keys);
}

