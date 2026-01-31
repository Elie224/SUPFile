import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';
import '../utils/secure_storage.dart';
import '../utils/input_validator.dart';
import '../utils/secure_logger.dart';
import '../utils/security_utils.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  String? _accessToken;
  String? _refreshToken;
  bool _isLoading = false;
  String? _error;
  
  final ApiService _apiService = ApiService();
  
  User? get user => _user;
  String? get accessToken => _accessToken;
  bool get isAuthenticated => _user != null && _accessToken != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  AuthProvider() {
    _loadStoredAuth();
  }
  
  Future<void> _loadStoredAuth() async {
    try {
      // Vérifier si une session active existe
      if (!await SecureStorage.hasActiveSession()) {
        await logout();
        return;
      }
      
      final token = await SecureStorage.getAccessToken();
      final userData = await SecureStorage.getUser();
      
      if (token != null && userData != null) {
        // Obfuscater les tokens en mémoire pour plus de sécurité
        _accessToken = SecurityUtils.obfuscate(token);
        final refreshToken = await SecureStorage.getRefreshToken();
        if (refreshToken != null) {
          _refreshToken = SecurityUtils.obfuscate(refreshToken);
        }
        _user = User.fromJson(userData);
        notifyListeners();
        
        // Vérifier que le token est toujours valide
        try {
          final response = await _apiService.getMe();
          _user = User.fromJson(response.data['data']);
          await _saveUser(_user!);
        } catch (e) {
          // Token invalide, déconnecter
          await logout();
        }
      }
    } catch (e) {
      SecureLogger.error('Error loading stored auth', error: e);
      await logout();
    }
  }
  
  
  Future<bool> signup(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    // Validation côté client
    if (!InputValidator.isValidEmail(email)) {
      _error = "Email invalide";
      _isLoading = false;
      notifyListeners();
      return false;
    }
    
    if (!InputValidator.isValidPassword(password)) {
      _error = "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre";
      _isLoading = false;
      notifyListeners();
      return false;
    }
    
    try {
      final response = await _apiService.signup(email, password);
      if (response.statusCode == 201) {
        final data = response.data['data'];
        final accessToken = data['access_token'] as String;
        final refreshToken = data['refresh_token'] as String;
        _user = User.fromJson(data['user']);
        
        // Sauvegarder les tokens (non obfuscatés pour le stockage)
        await SecureStorage.saveAccessToken(accessToken);
        await SecureStorage.saveRefreshToken(refreshToken);
        // Obfuscater en mémoire
        _accessToken = SecurityUtils.obfuscate(accessToken);
        _refreshToken = SecurityUtils.obfuscate(refreshToken);
        await _saveUser(_user!);
        
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      if (e is DioException) {
        _error = (e.response?.data['error']?['message'] as String?) ?? 
                 (e.error?.toString() ?? "Erreur lors de l'inscription");
      } else {
        _error = "Erreur lors de l'inscription";
      }
    }
    
    _isLoading = false;
    notifyListeners();
    return false;
  }
  
  /// Résultat de la connexion : succès, 2FA requis, ou erreur
  static const String loginResultSuccess = 'success';
  static const String loginResultRequires2FA = 'requires_2fa';
  static const String loginResultError = 'error';

  /// Connexion. Retourne [loginResultSuccess], [loginResultRequires2FA] ou [loginResultError].
  /// En cas de 2FA requis, utiliser [verify2FALogin] avec le [userId] retourné.
  Future<String> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    if (!InputValidator.isValidEmail(email)) {
      _error = "Email invalide";
      _isLoading = false;
      notifyListeners();
      return loginResultError;
    }
    if (password.isEmpty) {
      _error = "Le mot de passe est requis";
      _isLoading = false;
      notifyListeners();
      return loginResultError;
    }

    try {
      final response = await _apiService.login(email, password);
      if (response.statusCode == 200) {
        final data = response.data['data'];
        if (data == null || data is! Map<String, dynamic>) {
          _error = "Réponse invalide du serveur";
          _isLoading = false;
          notifyListeners();
          return loginResultError;
        }

        // 2FA requis : pas de tokens, demander le code
        if (data['requires_2fa'] == true) {
          _pending2FAUserId = data['user_id']?.toString();
          _pending2FAEmail = data['email']?.toString();
          _error = null;
          _isLoading = false;
          notifyListeners();
          return loginResultRequires2FA;
        }

        final accessToken = data['access_token'] as String?;
        final refreshToken = data['refresh_token'] as String?;
        final userData = data['user'];
        if (accessToken == null || accessToken.isEmpty ||
            refreshToken == null || refreshToken.isEmpty ||
            userData == null) {
          _error = "Données d'authentification incomplètes";
          _isLoading = false;
          notifyListeners();
          return loginResultError;
        }
        try {
          _user = User.fromJson(userData as Map<String, dynamic>);
        } catch (e) {
          _error = "Erreur lors du parsing des données utilisateur";
          _isLoading = false;
          notifyListeners();
          return loginResultError;
        }
        await SecureStorage.saveAccessToken(accessToken);
        await SecureStorage.saveRefreshToken(refreshToken);
        _accessToken = SecurityUtils.obfuscate(accessToken);
        _refreshToken = SecurityUtils.obfuscate(refreshToken);
        await _saveUser(_user!);
        _pending2FAUserId = null;
        _pending2FAEmail = null;
        _isLoading = false;
        notifyListeners();
        return loginResultSuccess;
      } else {
        _error = "Erreur lors de la connexion (code: ${response.statusCode})";
      }
    } catch (e) {
      if (e is DioException) {
        _error = (e.response?.data['error']?['message'] as String?) ??
            (e.error?.toString() ?? "Erreur lors de la connexion");
      } else {
        _error = "Erreur lors de la connexion";
      }
    }
    _isLoading = false;
    notifyListeners();
    return loginResultError;
  }

  String? _pending2FAUserId;
  String? _pending2FAEmail;
  String? get pending2FAUserId => _pending2FAUserId;
  String? get pending2FAEmail => _pending2FAEmail;

  /// Vérification du code 2FA après login. À appeler après [login] si retour = [loginResultRequires2FA].
  Future<bool> verify2FALogin(String token) async {
    final userId = _pending2FAUserId;
    if (userId == null || userId.isEmpty) {
      _error = "Session 2FA invalide. Reconnectez-vous.";
      notifyListeners();
      return false;
    }
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _apiService.verify2FALogin(userId, token);
      if (response.statusCode == 200) {
        final data = response.data['data'];
        if (data == null || data is! Map<String, dynamic>) {
          _error = "Réponse invalide du serveur";
          _isLoading = false;
          notifyListeners();
          return false;
        }
        final accessToken = data['access_token'] as String?;
        final refreshToken = data['refresh_token'] as String?;
        final userData = data['user'];
        if (accessToken == null || accessToken.isEmpty ||
            refreshToken == null || refreshToken.isEmpty ||
            userData == null) {
          _error = "Données d'authentification incomplètes";
          _isLoading = false;
          notifyListeners();
          return false;
        }
        try {
          _user = User.fromJson(userData as Map<String, dynamic>);
        } catch (e) {
          _error = "Erreur lors du parsing des données utilisateur";
          _isLoading = false;
          notifyListeners();
          return false;
        }
        await SecureStorage.saveAccessToken(accessToken);
        await SecureStorage.saveRefreshToken(refreshToken);
        _accessToken = SecurityUtils.obfuscate(accessToken);
        _refreshToken = SecurityUtils.obfuscate(refreshToken);
        await _saveUser(_user!);
        _pending2FAUserId = null;
        _pending2FAEmail = null;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      if (e is DioException) {
        _error = (e.response?.data['error']?['message'] as String?) ??
            (e.error?.toString() ?? "Code 2FA invalide");
      } else {
        _error = "Code 2FA invalide";
      }
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }
  
  Future<bool> oauthLogin(String provider, Map<String, dynamic> oauthData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      final response = await _apiService.oauthLogin(provider, oauthData);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data['data'];
        
        // Validation des données reçues
        if (data == null || data is! Map<String, dynamic>) {
          _error = "Réponse invalide du serveur";
          _isLoading = false;
          notifyListeners();
          return false;
        }
        
        final accessToken = data['access_token'] as String?;
        final refreshToken = data['refresh_token'] as String?;
        final userData = data['user'];
        
        if (accessToken == null || accessToken.isEmpty ||
            refreshToken == null || refreshToken.isEmpty ||
            userData == null) {
          _error = "Données d'authentification incomplètes";
          _isLoading = false;
          notifyListeners();
          return false;
        }
        
        try {
          _user = User.fromJson(userData as Map<String, dynamic>);
        } catch (e) {
          _error = "Erreur lors du parsing des données utilisateur";
          _isLoading = false;
          notifyListeners();
          return false;
        }
        
        // Sauvegarder les tokens (non obfuscatés pour le stockage)
        await SecureStorage.saveAccessToken(accessToken);
        await SecureStorage.saveRefreshToken(refreshToken);
        // Obfuscater en mémoire
        _accessToken = SecurityUtils.obfuscate(accessToken);
        _refreshToken = SecurityUtils.obfuscate(refreshToken);
        await _saveUser(_user!);
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = "Erreur lors de la connexion OAuth (code: ${response.statusCode})";
      }
    } catch (e) {
      if (e is DioException) {
        _error = (e.response?.data['error']?['message'] as String?) ?? 
                 (e.error?.toString() ?? "Erreur lors de la connexion OAuth");
      } else {
        _error = "Erreur lors de la connexion OAuth";
      }
    }
    
    _isLoading = false;
    notifyListeners();
    return false;
  }
  
  Future<void> logout() async {
    if (_refreshToken != null) {
      try {
        // Désobfuscater le refresh token pour l'API
        final deobfuscatedToken = SecurityUtils.deobfuscate(_refreshToken!);
        await _apiService.logout(deobfuscatedToken);
      } catch (e) {
        SecureLogger.error('Error during logout', error: e);
      }
    }
    
    _user = null;
    _accessToken = null;
    _refreshToken = null;
    
    // Nettoyer le stockage sécurisé
    await SecureStorage.clearAll();
    
    notifyListeners();
  }
  
  Future<void> _saveUser(User user) async {
    await SecureStorage.saveUser(user.toJson());
  }
  
  Future<void> refreshUser() async {
    try {
      final response = await _apiService.getMe();
      _user = User.fromJson(response.data['data']);
      await _saveUser(_user!);
      notifyListeners();
    } catch (e) {
      SecureLogger.error('Error refreshing user', error: e);
    }
  }
}

