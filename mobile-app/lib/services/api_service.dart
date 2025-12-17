import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';
import '../utils/secure_storage.dart';
import '../utils/rate_limiter.dart';
import '../utils/network_utils.dart';
import '../utils/secure_logger.dart';
import '../utils/security_utils.dart';
import '../utils/http_cache.dart';
import '../utils/performance_cache.dart';

class ApiService {
  late Dio _dio;
  
  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiUrl,
      connectTimeout: const Duration(seconds: 15), // Réduit pour réponses plus rapides
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Connection': 'keep-alive', // Réutiliser les connexions
      },
      // Validation SSL/TLS
      validateStatus: (status) => status != null && status < 500,
      // Réutiliser les connexions HTTP
      persistentConnection: true,
    ));
    
    // Initialiser le cache HTTP de manière asynchrone
    HttpCache.initialize();
    
    // Intercepteur de cache HTTP (si disponible)
    final cacheInterceptor = HttpCache.getInterceptor();
    if (cacheInterceptor != null) {
      _dio.interceptors.add(cacheInterceptor);
    }
    
    // Intercepteur de compression
    _dio.interceptors.add(NetworkUtils.createCompressionInterceptor());
    
    // Intercepteur de retry avec backoff exponentiel
    _dio.interceptors.add(NetworkUtils.createRetryInterceptor());
    
    // Intercepteur pour ajouter le token et rate limiting
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Rate limiting
        final endpoint = options.path;
        if (!apiRateLimiter.canMakeRequest(endpoint)) {
          final waitTime = apiRateLimiter.getTimeUntilNextRequest(endpoint);
          return handler.reject(DioException(
            requestOptions: options,
            type: DioExceptionType.connectionTimeout,
            error: 'Rate limit exceeded. Please wait ${waitTime?.inSeconds ?? 0} seconds.',
          ));
        }
        
        // Ajouter le token depuis le stockage sécurisé
        final token = await SecureStorage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        
        // Ajouter un nonce pour protéger contre les replay attacks
        final nonce = SecurityUtils.generateNonce();
        options.headers['X-Request-Nonce'] = nonce;
        options.headers['X-Request-Timestamp'] = DateTime.now().millisecondsSinceEpoch.toString();
        
        // Logging sécurisé (sans données sensibles)
        SecureLogger.apiRequest(options.method, options.path, headers: options.headers);
        
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Logging sécurisé des erreurs
        SecureLogger.error(
          'API Error: ${error.requestOptions.method} ${error.requestOptions.path}',
          error: error,
        );
        
        if (error.response?.statusCode == 401) {
          // Token expiré, essayer de rafraîchir
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Réessayer la requête
            final opts = error.requestOptions;
            final token = await SecureStorage.getAccessToken();
            if (token != null) {
              opts.headers['Authorization'] = 'Bearer $token';
            }
            try {
              final response = await _dio.fetch(opts);
              return handler.resolve(response);
            } catch (e) {
              // Si la retry échoue, déconnecter l'utilisateur
              await SecureStorage.clearAll();
              return handler.next(error);
            }
          } else {
            // Refresh échoué, déconnecter
            await SecureStorage.clearAll();
          }
        }
        return handler.next(error);
      },
    ));
  }
  
  Future<bool> _refreshToken() async {
    try {
      // Rate limiting pour le refresh
      if (!authRateLimiter.canMakeRequest('refresh')) {
        SecureLogger.warning('Rate limit hit for refresh token');
        return false;
      }
      
      final refreshToken = await SecureStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        SecureLogger.warning('No refresh token available');
        return false;
      }
      
      final response = await _dio.post('/auth/refresh', data: {
        'refresh_token': refreshToken,
      });
      
      if (response.statusCode == 200) {
        // Validation des données reçues
        final data = response.data['data'];
        if (data == null || data is! Map<String, dynamic>) {
          SecureLogger.error('Invalid refresh token response');
          return false;
        }
        
        final accessToken = data['access_token'] as String?;
        final newRefreshToken = data['refresh_token'] as String?;
        
        if (accessToken == null || accessToken.isEmpty ||
            newRefreshToken == null || newRefreshToken.isEmpty) {
          SecureLogger.error('Incomplete token data in refresh response');
          return false;
        }
        
        await SecureStorage.saveAccessToken(accessToken);
        await SecureStorage.saveRefreshToken(newRefreshToken);
        
        // Mettre à jour l'expiration de la session
        await SecureStorage.updateSessionExpiry(const Duration(hours: 1));
        
        return true;
      }
    } catch (e) {
      SecureLogger.error('Error refreshing token', error: e);
    }
    return false;
  }
  
  // Auth
  Future<Response> signup(String email, String password) async {
    // Rate limiting pour l'inscription
    if (!authRateLimiter.canMakeRequest('signup')) {
      final waitTime = authRateLimiter.getTimeUntilNextRequest('signup');
      throw DioException(
        requestOptions: RequestOptions(path: '/auth/signup'),
        type: DioExceptionType.connectionTimeout,
        error: 'Too many signup attempts. Please wait ${waitTime?.inSeconds ?? 0} seconds.',
      );
    }
    
    return _dio.post('/auth/signup', data: {
      'email': email.trim().toLowerCase(),
      'password': password,
    });
  }
  
  Future<Response> login(String email, String password) async {
    // Rate limiting pour la connexion
    if (!authRateLimiter.canMakeRequest('login')) {
      final waitTime = authRateLimiter.getTimeUntilNextRequest('login');
      throw DioException(
        requestOptions: RequestOptions(path: '/auth/login'),
        type: DioExceptionType.connectionTimeout,
        error: 'Too many login attempts. Please wait ${waitTime?.inSeconds ?? 0} seconds.',
      );
    }
    
    return _dio.post('/auth/login', data: {
      'email': email.trim().toLowerCase(),
      'password': password,
    });
  }
  
  Future<Response> logout(String refreshToken) {
    return _dio.post('/auth/logout', data: {
      'refresh_token': refreshToken,
    });
  }
  
  // OAuth
  Future<Response> oauthLogin(String provider, Map<String, dynamic> oauthData) {
    return _dio.post('/auth/$provider/callback', data: oauthData);
  }
  
  // Files
  Future<Response> listFiles({String? folderId, int skip = 0, int limit = 50}) async {
    // Vérifier le cache d'abord
    final cacheKey = 'files_${folderId ?? 'root'}_$skip\_$limit';
    final cached = await PerformanceCache.get<Map<String, dynamic>>(cacheKey);
    if (cached != null) {
      return Response(
        requestOptions: RequestOptions(path: '/files'),
        data: cached,
        statusCode: 200,
      );
    }
    
    final queryParams = <String, dynamic>{
      if (folderId != null) 'folder_id': folderId,
      'skip': skip,
      'limit': limit,
    };
    
    final response = await _dio.get('/files', queryParameters: queryParams);
    
    // Mettre en cache si succès
    if (response.statusCode == 200) {
      await PerformanceCache.set(
        cacheKey,
        response.data,
        expiry: const Duration(minutes: 5),
      );
    }
    
    return response;
  }
  
  Future<Response> uploadFile(
    File file, {
    String? folderId,
    Function(int sent, int total)? onProgress,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: file.path.split(Platform.pathSeparator).last),
      if (folderId != null) 'folder_id': folderId,
    });
    
    return _dio.post(
      '/files/upload',
      data: formData,
      onSendProgress: onProgress != null
          ? (sent, total) => onProgress(sent, total)
          : null,
    );
  }
  
  Future<Response> deleteFile(String fileId) {
    return _dio.delete('/files/$fileId');
  }
  
  Future<Response> renameFile(String fileId, String newName) {
    return _dio.patch('/files/$fileId', data: {'name': newName});
  }
  
  Future<Response> moveFile(String fileId, String? folderId) {
    return _dio.patch('/files/$fileId', data: {'folder_id': folderId});
  }
  
  Future<Response> downloadFile(String fileId) {
    return _dio.get(
      '/files/$fileId/download',
      options: Options(responseType: ResponseType.bytes),
    );
  }
  
  Future<Response> previewFile(String fileId) {
    return _dio.get('/files/$fileId/preview');
  }
  
  Future<Response> streamFile(String fileId) {
    return _dio.get('/files/$fileId/stream');
  }
  
  // Folders
  Future<Response> createFolder(String name, {String? parentId}) {
    return _dio.post('/folders', data: {
      'name': name,
      if (parentId != null) 'parent_id': parentId,
    });
  }
  
  Future<Response> listFolders({String? parentId}) {
    final queryParams = parentId != null ? <String, dynamic>{'parent_id': parentId} : <String, dynamic>{};
    return _dio.get('/folders', queryParameters: queryParams);
  }
  
  Future<Response> getFolder(String folderId) {
    return _dio.get('/folders/$folderId');
  }
  
  Future<Response> getAllFolders() {
    return _dio.get('/folders/all');
  }
  
  Future<Response> deleteFolder(String folderId) {
    return _dio.delete('/folders/$folderId');
  }
  
  Future<Response> renameFolder(String folderId, String newName) {
    return _dio.patch('/folders/$folderId', data: {'name': newName});
  }
  
  Future<Response> moveFolder(String folderId, String? parentId) {
    return _dio.patch('/folders/$folderId', data: {'parent_id': parentId});
  }
  
  Future<Response> downloadFolder(String folderId) {
    return _dio.get(
      '/folders/$folderId/download',
      options: Options(responseType: ResponseType.bytes),
    );
  }
  
  // Share
  Future<Response> createPublicShare({
    String? fileId,
    String? folderId,
    String? password,
    DateTime? expiresAt,
  }) {
    return _dio.post('/share/public', data: {
      if (fileId != null) 'file_id': fileId,
      if (folderId != null) 'folder_id': folderId,
      if (password != null && password.isNotEmpty) 'password': password,
      if (expiresAt != null) 'expires_at': expiresAt.toIso8601String(),
    });
  }
  
  Future<Response> createInternalShare({
    String? fileId,
    String? folderId,
    required String userId,
  }) {
    return _dio.post('/share/internal', data: {
      if (fileId != null) 'file_id': fileId,
      if (folderId != null) 'folder_id': folderId,
      'shared_with_user_id': userId,
    });
  }
  
  Future<Response> getPublicShare(String token, {String? password}) {
    final queryParams = password != null ? <String, dynamic>{'password': password} : <String, dynamic>{};
    // Créer une instance Dio sans intercepteur d'authentification pour les partages publics
    final publicDio = Dio(BaseOptions(
      baseUrl: AppConstants.apiUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ));
    return publicDio.get('/share/$token', queryParameters: queryParams);
  }
  
  // Dashboard
  Future<Response> getDashboard() async {
    // Cache du dashboard (données qui changent peu)
    const cacheKey = 'dashboard';
    final cached = await PerformanceCache.get<Map<String, dynamic>>(cacheKey);
    if (cached != null) {
      return Response(
        requestOptions: RequestOptions(path: '/dashboard'),
        data: cached,
        statusCode: 200,
      );
    }
    
    final response = await _dio.get('/dashboard');
    
    // Mettre en cache si succès (cache plus long pour dashboard)
    if (response.statusCode == 200) {
      await PerformanceCache.set(
        cacheKey,
        response.data,
        expiry: const Duration(minutes: 10),
      );
    }
    
    return response;
  }
  
  // Search
  Future<Response> search({
    required String query,
    String? type,
    String? mimeType,
    String? dateFrom,
    String? dateTo,
  }) {
    return _dio.get('/search', queryParameters: {
      'q': query,
      if (type != null) 'type': type,
      if (mimeType != null) 'mime_type': mimeType,
      if (dateFrom != null) 'date_from': dateFrom,
      if (dateTo != null) 'date_to': dateTo,
    });
  }
  
  // Users
  Future<Response> getMe() {
    return _dio.get('/users/me');
  }
  
  Future<Response> updateProfile({String? email, String? displayName}) {
    return _dio.patch('/users/me', data: {
      if (email != null) 'email': email,
      if (displayName != null) 'display_name': displayName,
    });
  }
  
  Future<Response> changePassword(String currentPassword, String newPassword) {
    return _dio.patch('/users/me/password', data: {
      'current_password': currentPassword,
      'new_password': newPassword,
    });
  }
  
  Future<Response> uploadAvatar(File file) async {
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(file.path, filename: file.path.split(Platform.pathSeparator).last),
    });
    return _dio.post('/users/me/avatar', data: formData);
  }
  
  Future<Response> updatePreferences(Map<String, dynamic> preferences) {
    return _dio.patch('/users/me/preferences', data: {'preferences': preferences});
  }
  
  Future<Response> listUsers(String search) {
    return _dio.get('/users', queryParameters: {'search': search});
  }
  
  // Trash
  Future<Response> listTrashFiles() {
    return _dio.get('/files/trash');
  }
  
  Future<Response> listTrashFolders() {
    return _dio.get('/folders/trash');
  }
  
  Future<Response> restoreFile(String fileId) {
    return _dio.post('/files/$fileId/restore');
  }
  
  Future<Response> restoreFolder(String folderId) {
    return _dio.post('/folders/$folderId/restore');
  }
}

