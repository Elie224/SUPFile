import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:app_links/app_links.dart';
import 'dart:async';
import '../utils/constants.dart';
import '../utils/secure_logger.dart';

// Initialiser le stream de deep links une seule fois
final AppLinks _appLinks = AppLinks();
Stream<Uri>? _uriLinkStream;
Stream<Uri> get _linkStream {
  _uriLinkStream ??= _appLinks.uriLinkStream;
  return _uriLinkStream!;
}

class TimeoutException implements Exception {
  final String message;
  TimeoutException(this.message);
}

/// Service pour gérer l'authentification OAuth avec Google et GitHub
class OAuthService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  /// Connexion avec Google (natif)
  static Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        // L'utilisateur a annulé la connexion
        return null;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      // Envoyer le token au backend pour validation et création de compte
      return {
        'provider': 'google',
        'id_token': googleAuth.idToken,
        'access_token': googleAuth.accessToken,
        'email': googleUser.email,
        'display_name': googleUser.displayName,
        'photo_url': googleUser.photoUrl,
      };
    } catch (e) {
      SecureLogger.error('Error signing in with Google', error: e);
      rethrow;
    }
  }

  /// Connexion avec GitHub (via navigateur avec deep link)
  static Future<Map<String, dynamic>?> signInWithGitHub() async {
    try {
      // URL de callback pour capturer le token
      final callbackUrl = 'supfile://oauth/github/callback';
      final oauthUrl = '${AppConstants.apiBaseUrl}/api/auth/github?redirect_uri=$callbackUrl';
      
      // Écouter les deep links
      final completer = Completer<Map<String, dynamic>?>();
      StreamSubscription? linkSubscription;

      // Vérifier d'abord si l'app a été ouverte avec un deep link
      try {
        final initialLink = await _appLinks.getInitialLink();
        if (initialLink != null && initialLink.toString().startsWith('supfile://oauth/github/callback')) {
          final token = initialLink.queryParameters['token'];
          final refreshToken = initialLink.queryParameters['refresh_token'];
          if (token != null && refreshToken != null) {
            return {
              'access_token': token,
              'refresh_token': refreshToken,
            };
          }
        }
      } catch (e) {
        // Ignorer si pas de deep link initial
      }

      // Écouter les nouveaux deep links
      linkSubscription = _linkStream.listen((Uri uri) {
        final link = uri.toString();
        if (link.startsWith('supfile://oauth/github/callback')) {
          final callbackUri = uri;
          final token = callbackUri.queryParameters['token'];
          final refreshToken = callbackUri.queryParameters['refresh_token'];
          
          if (token != null && refreshToken != null) {
            completer.complete({
              'access_token': token,
              'refresh_token': refreshToken,
            });
          } else {
            completer.complete(null);
          }
          
          linkSubscription?.cancel();
        }
      }, onError: (err) {
        completer.completeError(err);
        linkSubscription?.cancel();
      });

      // Ouvrir le navigateur pour l'authentification
      final uri = Uri.parse(oauthUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        
        // Attendre le callback (timeout après 5 minutes)
        return await completer.future.timeout(
          const Duration(minutes: 5),
          onTimeout: () {
            linkSubscription?.cancel();
            throw TimeoutException('OAuth timeout');
          },
        );
      } else {
        linkSubscription?.cancel();
        throw 'Impossible d\'ouvrir le navigateur';
      }
    } catch (e) {
      SecureLogger.error('Error signing in with GitHub', error: e);
      rethrow;
    }
  }

  /// Connexion OAuth générique (fallback vers navigateur)
  static Future<void> signInWithProvider(String provider) async {
    try {
      final callbackUrl = 'supfile://oauth/$provider/callback';
      final oauthUrl = '${AppConstants.apiBaseUrl}/api/auth/$provider?redirect_uri=$callbackUrl';
      
      final uri = Uri.parse(oauthUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
      } else {
        throw 'Impossible d\'ouvrir le navigateur';
      }
    } catch (e) {
      SecureLogger.error('Error signing in with $provider', error: e);
      rethrow;
    }
  }

  /// Déconnexion Google
  static Future<void> signOutGoogle() async {
    try {
      await _googleSignIn.signOut();
    } catch (e) {
      SecureLogger.error('Error signing out from Google', error: e);
    }
  }
}


