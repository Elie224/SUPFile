import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
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
    clientId: kIsWeb && AppConstants.googleWebClientId.trim().isNotEmpty
        ? AppConstants.googleWebClientId.trim()
        : null,
    serverClientId: !kIsWeb && AppConstants.googleServerClientId.trim().isNotEmpty
        ? AppConstants.googleServerClientId.trim()
        : null,
  );

  static final RegExp _googleClientIdPattern =
      RegExp(r'^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$', caseSensitive: false);

  static bool _looksLikeGoogleClientId(String value) {
    final v = value.trim();
    if (v.isEmpty) return false;
    if (v.contains('__DUMMY__')) return false;
    return _googleClientIdPattern.hasMatch(v);
  }

  /// Connexion avec Google (natif)
  static Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      if (kIsWeb) {
        final configuredId = AppConstants.googleWebClientId.trim();
        if (configuredId.isEmpty) {
          throw StateError(
            'Google OAuth non configuré pour le Web (GOOGLE_WEB_CLIENT_ID manquant).',
          );
        }
        if (!_looksLikeGoogleClientId(configuredId)) {
          throw StateError(
            'Google OAuth Web mal configuré : GOOGLE_WEB_CLIENT_ID invalide. '
            'Utilisez le "Client ID" d\'un client OAuth de type "Application Web" (se termine par .apps.googleusercontent.com).',
          );
        }
      }

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
      final message = e.toString();
      // On web, closing the popup is a user cancel, not an app error.
      if (kIsWeb && (message.contains('popup_closed') || message.contains('user_closed_popup'))) {
        return null;
      }
      SecureLogger.error('Error signing in with Google', error: e);
      rethrow;
    }
  }

  /// Connexion avec GitHub (via navigateur avec deep link)
  static Future<Map<String, dynamic>?> signInWithGitHub() async {
    try {
      // URL de callback pour capturer le token
      const callbackUrl = 'supfile://oauth/github/callback';
      final oauthUri = Uri.parse('${AppConstants.apiBaseUrl}/api/auth/github').replace(
        queryParameters: {'redirect_uri': callbackUrl},
      );
      
      // Écouter les deep links
      final completer = Completer<Map<String, dynamic>?>();

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
      late final StreamSubscription<Uri> linkSubscription;
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
          
          linkSubscription.cancel();
        }
      }, onError: (err) {
        completer.completeError(err);
        linkSubscription.cancel();
      });

      // Ouvrir le navigateur pour l'authentification
      if (await canLaunchUrl(oauthUri)) {
        await launchUrl(
          oauthUri,
          mode: LaunchMode.externalApplication,
        );
        
        // Attendre le callback (timeout après 5 minutes)
        return await completer.future.timeout(
          const Duration(minutes: 5),
          onTimeout: () {
            linkSubscription.cancel();
            throw TimeoutException('OAuth timeout');
          },
        );
      } else {
        linkSubscription.cancel();
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
      final oauthUri = Uri.parse('${AppConstants.apiBaseUrl}/api/auth/$provider').replace(
        queryParameters: {'redirect_uri': callbackUrl},
      );

      if (await canLaunchUrl(oauthUri)) {
        await launchUrl(
          oauthUri,
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


