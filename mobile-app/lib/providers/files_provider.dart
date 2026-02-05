import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/file.dart';
import '../models/folder.dart';
import '../services/api_service.dart';
import '../utils/file_security.dart';
import '../utils/rate_limiter.dart';
import '../utils/performance_optimizer.dart';
import '../utils/performance_cache.dart';
import '../utils/secure_logger.dart';
import 'package:dio/dio.dart';

class FilesProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<FileItem> _files = [];
  List<FolderItem> _folders = [];
  FolderItem? _currentFolder;
  String? _currentFolderId;
  int _itemsRevision = 0;
  bool _isLoading = false;
  String? _error;

  List<FileItem> get files => _files;
  List<FolderItem> get folders => _folders;
  FolderItem? get currentFolder => _currentFolder;
  String? get currentFolderId => _currentFolderId;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  void _touchItems() {
    _itemsRevision++;
  }

  List<dynamic> get allItems {
    // Utiliser la memoization pour éviter les recalculs
    return PerformanceOptimizer.memoize(
          'allItems_${_itemsRevision}_${_folders.length}_${_files.length}',
          () => [
            ..._folders.map((f) => {'type': 'folder', 'item': f}),
            ..._files.map((f) => {'type': 'file', 'item': f}),
          ],
          expiry: const Duration(seconds: 1),
        ) ??
        [];
  }

  Future<void> loadFiles({String? folderId, int skip = 0, int limit = 50, bool force = false}) async {
    final throttleKey = 'loadFiles_${folderId ?? 'root'}';
    if (!force && !PerformanceOptimizer.throttle(throttleKey, const Duration(milliseconds: 300))) {
      return;
    }

    // Keep track of the folder currently displayed by the UI.
    _currentFolderId = folderId;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.listFiles(
        folderId: folderId,
        skip: skip,
        limit: limit,
      );

      if (response.statusCode == 200) {
        final items = response.data['data']['items'] ?? [];

        if (skip == 0) {
          _files = [];
          _folders = [];
        }

        for (final item in items) {
          if (item is! Map<String, dynamic>) continue;
          try {
            if (item['type'] == 'file' || item['folder_id'] != null) {
              final file = FileItem.fromJson(item);
              if (file.id.isNotEmpty && file.name.isNotEmpty) {
                _files.add(file);
              }
            } else if (item['type'] == 'folder' || item['parent_id'] != null || item['folder_id'] == null) {
              final folder = FolderItem.fromJson(item);
              if (folder.id.isNotEmpty && folder.name.isNotEmpty) {
                _folders.add(folder);
              }
            }
          } catch (e) {
            SecureLogger.warning('Failed to parse item: $e', data: {'item': item});
          }
        }

        if (_files.length > 1000) _files = _files.sublist(_files.length - 1000);
        if (_folders.length > 1000) _folders = _folders.sublist(_folders.length - 1000);

        _touchItems();
        PerformanceOptimizer.cleanExpiredCache();
      }
    } catch (e) {
      if (e is DioException) {
        final statusCode = e.response?.statusCode;
        switch (statusCode) {
          case 401:
            _error = 'Votre session a expiré. Veuillez vous reconnecter.';
            break;
          case 403:
            _error = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
            break;
          case 404:
            _error = 'Dossier non trouvé.';
            break;
          case 429:
            _error = 'Trop de requêtes. Veuillez patienter quelques instants.';
            break;
          case 500:
          case 502:
          case 503:
            _error = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          default:
            _error = e.response?.data?['error']?['message'] ?? e.message ?? 'Erreur lors du chargement des fichiers';
        }
      } else {
        _error = e.toString();
      }
    }

    _isLoading = false;
    notifyListeners();
  }
  
  Future<bool> uploadFile(String filePath, {String? folderId, Function(int, int)? onProgress}) async {
    try {
      final file = File(filePath);
      final validation = FileSecurity.validateFile(file);
      if (!validation.isValid) {
        _error = validation.error ?? 'Fichier invalide';
        notifyListeners();
        return false;
      }

      if (!uploadRateLimiter.canMakeRequest('upload')) {
        final waitTime = uploadRateLimiter.getTimeUntilNextRequest('upload');
        _error = 'Trop d\'uploads. Veuillez attendre ${waitTime?.inSeconds ?? 0} secondes.';
        notifyListeners();
        return false;
      }

      final response = await _apiService.uploadFile(
        file,
        folderId: folderId,
        onProgress: onProgress,
      );

      if (response.statusCode == 201) {
        await PerformanceCache.removeByPrefix('files_${folderId ?? 'root'}_');
        await loadFiles(folderId: folderId, force: true);
        return true;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
    return false;
  }

  Future<bool> uploadFileBytes(Uint8List bytes, String filename, {String? folderId, Function(int, int)? onProgress}) async {
    try {
      if (!uploadRateLimiter.canMakeRequest('upload')) {
        final waitTime = uploadRateLimiter.getTimeUntilNextRequest('upload');
        _error = 'Trop d\'uploads. Veuillez attendre ${waitTime?.inSeconds ?? 0} secondes.';
        notifyListeners();
        return false;
      }

      final response = await _apiService.uploadFileBytes(
        bytes,
        filename,
        folderId: folderId,
        onProgress: onProgress,
      );

      if (response.statusCode == 201) {
        await PerformanceCache.removeByPrefix('files_${folderId ?? 'root'}_');
        await loadFiles(folderId: folderId, force: true);
        return true;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
    return false;
  }

  Future<bool> uploadFileStream(
    Stream<List<int>> Function() stream,
    int length,
    String filename, {
    String? folderId,
    Function(int, int)? onProgress,
  }) async {
    try {
      if (length <= 0) {
        _error = 'Le fichier est vide';
        notifyListeners();
        return false;
      }

      if (!uploadRateLimiter.canMakeRequest('upload')) {
        final waitTime = uploadRateLimiter.getTimeUntilNextRequest('upload');
        _error = 'Trop d\'uploads. Veuillez attendre ${waitTime?.inSeconds ?? 0} secondes.';
        notifyListeners();
        return false;
      }

      final response = await _apiService.uploadFileStream(
        stream,
        length,
        filename,
        folderId: folderId,
        onProgress: onProgress,
      );

      if (response.statusCode == 201) {
        await PerformanceCache.removeByPrefix('files_${folderId ?? 'root'}_');
        await loadFiles(folderId: folderId, force: true);
        return true;
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
    return false;
  }
  
  Future<bool> deleteFile(String fileId) async {
    try {
      await _apiService.deleteFile(fileId);
      await PerformanceCache.removeByPrefix('files_${_currentFolderId ?? 'root'}_');
      await loadFiles(folderId: _currentFolderId, force: true);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteFolder(String folderId) async {
    try {
      await _apiService.deleteFolder(folderId);
      await PerformanceCache.removeByPrefix('files_${_currentFolderId ?? 'root'}_');
      await loadFiles(folderId: _currentFolderId, force: true);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  
  Future<bool> renameFile(String fileId, String newName) async {
    try {
      await _apiService.renameFile(fileId, newName);
      await PerformanceCache.removeByPrefix('files_${_currentFolderId ?? 'root'}_');
      await loadFiles(folderId: _currentFolderId, force: true);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> renameFolder(String folderId, String newName) async {
    try {
      await _apiService.renameFolder(folderId, newName);
      await PerformanceCache.removeByPrefix('files_${_currentFolderId ?? 'root'}_');
      await loadFiles(folderId: _currentFolderId, force: true);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> createFolder(String name, {String? parentId}) async {
    try {
      await _apiService.createFolder(name, parentId: parentId ?? _currentFolderId);
      await PerformanceCache.removeByPrefix('files_${_currentFolderId ?? 'root'}_');
      await loadFiles(folderId: _currentFolderId, force: true);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  
  Future<bool> moveFile(String fileId, String? folderId) async {
    try {
      await _apiService.moveFile(fileId, folderId);
      await PerformanceCache.removeByPrefix('files_${_currentFolderId ?? 'root'}_');
      await loadFiles(folderId: _currentFolderId, force: true);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> moveFolder(String folderId, String? parentId) async {
    try {
      await _apiService.moveFolder(folderId, parentId);
      await PerformanceCache.removeByPrefix('files_${_currentFolderId ?? 'root'}_');
      await loadFiles(folderId: _currentFolderId, force: true);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  
  void setCurrentFolder(FolderItem? folder) {
    _currentFolder = folder;
    notifyListeners();
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

