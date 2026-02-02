import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/file.dart';
import '../models/folder.dart';
import '../services/api_service.dart';
import '../services/offline_storage_service.dart';
import '../services/sync_service.dart';
import '../utils/file_security.dart';
import '../utils/rate_limiter.dart';
import '../utils/performance_optimizer.dart';
import '../utils/performance_cache.dart';
import '../utils/secure_logger.dart';
import 'package:dio/dio.dart';

class FilesProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  SyncService get _syncService => SyncService();

  List<FileItem> _files = [];
  List<FolderItem> _folders = [];
  FolderItem? _currentFolder;
  bool _isLoading = false;
  String? _error;
  bool _isOfflineData = false;

  List<FileItem> get files => _files;
  List<FolderItem> get folders => _folders;
  FolderItem? get currentFolder => _currentFolder;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isOfflineData => _isOfflineData;
  
  List<dynamic> get allItems {
    // Utiliser la memoization pour éviter les recalculs
    return PerformanceOptimizer.memoize(
      'allItems_${_folders.length}_${_files.length}',
      () => [
        ..._folders.map((f) => {'type': 'folder', 'item': f}),
        ..._files.map((f) => {'type': 'file', 'item': f}),
      ],
      expiry: const Duration(seconds: 1),
    ) ?? [];
  }
  
  Future<void> loadFiles({String? folderId, int skip = 0, int limit = 50}) async {
    final throttleKey = 'loadFiles_${folderId ?? 'root'}';
    if (!PerformanceOptimizer.throttle(throttleKey, const Duration(milliseconds: 300))) {
      return;
    }

    _isLoading = true;
    _error = null;
    _isOfflineData = false;
    notifyListeners();

    if (!_syncService.isOnline) {
      try {
        await OfflineStorageService.init();
        _files = OfflineStorageService.getFilesByFolder(folderId);
        _folders = OfflineStorageService.getFoldersByParent(folderId);
        _isOfflineData = true;
      } catch (e) {
        _error = 'Données hors ligne indisponibles';
      }
      _isLoading = false;
      notifyListeners();
      return;
    }

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

        for (var item in items) {
          if (item is! Map<String, dynamic>) continue;
          try {
            if (item['type'] == 'file' || item['folder_id'] != null) {
              final file = FileItem.fromJson(item);
              if (file.id.isNotEmpty && file.name.isNotEmpty) {
                _files.add(file);
                if (skip == 0) {
                  OfflineStorageService.saveFileMap(item);
                }
              }
            } else if (item['type'] == 'folder' || item['parent_id'] != null || item['folder_id'] == null) {
              final folder = FolderItem.fromJson(item);
              if (folder.id.isNotEmpty && folder.name.isNotEmpty) {
                _folders.add(folder);
                if (skip == 0) {
                  OfflineStorageService.saveFolderMap(item);
                }
              }
            }
          } catch (e) {
            SecureLogger.warning('Failed to parse item: $e', data: {'item': item});
          }
        }

        if (_files.length > 1000) _files = _files.sublist(_files.length - 1000);
        if (_folders.length > 1000) _folders = _folders.sublist(_folders.length - 1000);
        PerformanceOptimizer.cleanExpiredCache();
      }
    } catch (e) {
      // En cas d'erreur réseau, utiliser le cache local (comportement web)
      final isNetworkError = e is DioException &&
          (e.type == DioExceptionType.connectionError ||
              e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout);
      if (isNetworkError) {
        try {
          await OfflineStorageService.init();
          _files = OfflineStorageService.getFilesByFolder(folderId);
          _folders = OfflineStorageService.getFoldersByParent(folderId);
          _isOfflineData = true;
          _error = null;
        } catch (_) {
          _error = 'Connexion impossible. Données en cache indisponibles.';
        }
      } else {
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

      if (!_syncService.isOnline) {
        await OfflineStorageService.addPendingOperation('upload', {
          'localPath': filePath,
          'folderId': folderId ?? _currentFolder?.id,
        });
        _syncService.notifyPendingChanged();
        await loadFiles(folderId: folderId ?? _currentFolder?.id);
        return true;
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
        await PerformanceCache.remove('files_${folderId ?? 'root'}_0_50');
        await loadFiles(folderId: folderId);
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
      if (!_syncService.isOnline) {
        await OfflineStorageService.addPendingOperation('delete_file', {'fileId': fileId});
        OfflineStorageService.deleteFile(fileId);
        _syncService.notifyPendingChanged();
        _files.removeWhere((f) => f.id == fileId);
        notifyListeners();
        return true;
      }
      await _apiService.deleteFile(fileId);
      await loadFiles(folderId: _currentFolder?.id);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteFolder(String folderId) async {
    try {
      if (!_syncService.isOnline) {
        await OfflineStorageService.addPendingOperation('delete_folder', {'folderId': folderId});
        OfflineStorageService.deleteFolder(folderId);
        _syncService.notifyPendingChanged();
        _folders.removeWhere((f) => f.id == folderId);
        notifyListeners();
        return true;
      }
      await _apiService.deleteFolder(folderId);
      await loadFiles(folderId: _currentFolder?.id);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  
  Future<bool> renameFile(String fileId, String newName) async {
    try {
      if (!_syncService.isOnline) {
        await OfflineStorageService.addPendingOperation('rename_file', {'fileId': fileId, 'newName': newName});
        final idx = _files.indexWhere((f) => f.id == fileId);
        if (idx >= 0) {
          final f = _files[idx];
          _files[idx] = FileItem(
            id: f.id,
            name: newName,
            mimeType: f.mimeType,
            size: f.size,
            folderId: f.folderId,
            ownerId: f.ownerId,
            filePath: f.filePath,
            isDeleted: f.isDeleted,
            createdAt: f.createdAt,
            updatedAt: DateTime.now(),
          );
        }
        _syncService.notifyPendingChanged();
        notifyListeners();
        return true;
      }
      await _apiService.renameFile(fileId, newName);
      await loadFiles(folderId: _currentFolder?.id);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> renameFolder(String folderId, String newName) async {
    try {
      if (!_syncService.isOnline) {
        await OfflineStorageService.addPendingOperation('rename_folder', {'folderId': folderId, 'newName': newName});
        final idx = _folders.indexWhere((f) => f.id == folderId);
        if (idx >= 0) {
          final f = _folders[idx];
          _folders[idx] = FolderItem(
            id: f.id,
            name: newName,
            parentId: f.parentId,
            ownerId: f.ownerId,
            isDeleted: f.isDeleted,
            createdAt: f.createdAt,
            updatedAt: DateTime.now(),
          );
        }
        _syncService.notifyPendingChanged();
        notifyListeners();
        return true;
      }
      await _apiService.renameFolder(folderId, newName);
      await loadFiles(folderId: _currentFolder?.id);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> createFolder(String name, {String? parentId}) async {
    try {
      if (!_syncService.isOnline) {
        await OfflineStorageService.addPendingOperation('create_folder', {
          'name': name,
          'parentId': parentId ?? _currentFolder?.id,
        });
        _syncService.notifyPendingChanged();
        await loadFiles(folderId: _currentFolder?.id);
        return true;
      }
      await _apiService.createFolder(name, parentId: parentId ?? _currentFolder?.id);
      await loadFiles(folderId: _currentFolder?.id);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  
  Future<bool> moveFile(String fileId, String? folderId) async {
    try {
      if (!_syncService.isOnline) {
        await OfflineStorageService.addPendingOperation('move_file', {
          'fileId': fileId,
          'folderId': folderId,
        });
        _syncService.notifyPendingChanged();
        final idx = _files.indexWhere((f) => f.id == fileId);
        if (idx >= 0) {
          final f = _files[idx];
          _files[idx] = FileItem(
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size,
            folderId: folderId,
            ownerId: f.ownerId,
            filePath: f.filePath,
            isDeleted: f.isDeleted,
            createdAt: f.createdAt,
            updatedAt: DateTime.now(),
          );
        }
        notifyListeners();
        return true;
      }
      await _apiService.moveFile(fileId, folderId);
      await loadFiles(folderId: _currentFolder?.id);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> moveFolder(String folderId, String? parentId) async {
    try {
      if (!_syncService.isOnline) {
        await OfflineStorageService.addPendingOperation('move_folder', {
          'folderId': folderId,
          'parentId': parentId,
        });
        _syncService.notifyPendingChanged();
        final idx = _folders.indexWhere((f) => f.id == folderId);
        if (idx >= 0) {
          final f = _folders[idx];
          _folders[idx] = FolderItem(
            id: f.id,
            name: f.name,
            parentId: parentId,
            ownerId: f.ownerId,
            isDeleted: f.isDeleted,
            createdAt: f.createdAt,
            updatedAt: DateTime.now(),
          );
        }
        notifyListeners();
        return true;
      }
      await _apiService.moveFolder(folderId, parentId);
      await loadFiles(folderId: _currentFolder?.id);
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

