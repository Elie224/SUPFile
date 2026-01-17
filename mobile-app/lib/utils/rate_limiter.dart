import 'dart:async';

/// Rate limiter pour limiter le nombre de requêtes par période
class RateLimiter {
  final int maxRequests;
  final Duration window;
  final Map<String, List<DateTime>> _requests = {};

  RateLimiter({
    required this.maxRequests,
    required this.window,
  });

  /// Vérifier si une requête peut être effectuée
  bool canMakeRequest(String key) {
    final now = DateTime.now();
    final requests = _requests[key] ?? [];
    
    // Supprimer les requêtes expirées
    final validRequests = requests.where((time) {
      return now.difference(time) < window;
    }).toList();
    
    _requests[key] = validRequests;
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.add(now);
    return true;
  }

  /// Obtenir le temps d'attente avant la prochaine requête possible
  Duration? getTimeUntilNextRequest(String key) {
    final now = DateTime.now();
    final requests = _requests[key] ?? [];
    
    if (requests.isEmpty || requests.length < maxRequests) {
      return null;
    }
    
    final oldestRequest = requests.first;
    final elapsed = now.difference(oldestRequest);
    
    if (elapsed >= window) {
      return null;
    }
    
    return window - elapsed;
  }

  /// Réinitialiser le rate limiter pour une clé
  void reset(String key) {
    _requests.remove(key);
  }

  /// Réinitialiser tous les rate limiters
  void resetAll() {
    _requests.clear();
  }
}

/// Rate limiter global pour l'authentification
final authRateLimiter = RateLimiter(
  maxRequests: 5,
  window: const Duration(minutes: 15),
);

/// Rate limiter global pour les requêtes API
final apiRateLimiter = RateLimiter(
  maxRequests: 100,
  window: const Duration(minutes: 1),
);

/// Rate limiter pour les uploads
final uploadRateLimiter = RateLimiter(
  maxRequests: 10,
  window: const Duration(minutes: 5),
);





