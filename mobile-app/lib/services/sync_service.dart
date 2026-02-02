import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'offline_storage_service.dart';
import 'api_service.dart';
import '../models/file.dart';
import '../models/folder.dart';

/// Service de synchronisation offline-first : envoie les opérations en attente au serveur
/// et met à jour le cache local quand on est en ligne.
class SyncService extends ChangeNotifier {
  final ApiService _api = ApiService();
  bool _isOnline = true;
  bool _isSyncing = false;
  String? _lastError;

  bool get isOnline => _isOnline;
  bool get isSyncing => _isSyncing;
  String? get lastError => _lastError;

  int get pendingCount => OfflineStorageService.getPendingOperations().length;

  static final SyncService _instance = SyncService._();
  factory SyncService() => _instance;

  SyncService._() {
    _initConnectivity();
  }

  void _initConnectivity() {
    Connectivity().checkConnectivity().then(_updateConnectivity);
    Connectivity().onConnectivityChanged.listen(_updateConnectivity);
  }

  void _updateConnectivity(ConnectivityResult result) {
    final wasOnline = _isOnline;
    _isOnline = result != ConnectivityResult.none;
    if (wasOnline != _isOnline) {
      notifyListeners();
      if (!wasOnline && _isOnline) {
        syncToServer();
      }
    }
  }

  /// Synchronise les opérations en attente vers le serveur
  Future<SyncResult> syncToServer() async {
    if (!_isOnline) {
      _lastError = 'Hors ligne';
      notifyListeners();
      return SyncResult(success: false, reason: 'offline');
    }
    _isSyncing = true;
    _lastError = null;
    notifyListeners();

    try {
      int successCount = 0;
      int failCount = 0;

      while (OfflineStorageService.getPendingOperations().isNotEmpty) {
        final ops = OfflineStorageService.getPendingOperations();
        final op = ops.first;
        final type = op['type'] as String?;
        final payload = op['payload'] is Map
            ? Map<String, dynamic>.from(op['payload'] as Map<dynamic, dynamic>)
            : <String, dynamic>{};

        try {
          if (type == 'upload' && payload['localPath'] != null) {
            final file = File(payload['localPath'] as String);
            if (await file.exists()) {
              final response = await _api.uploadFile(
                file,
                folderId: payload['folderId'] as String?,
              );
              if (response.statusCode == 201) {
                await OfflineStorageService.removePendingOperationAt(0);
                successCount++;
              } else {
                failCount++;
                break;
              }
            } else {
              await OfflineStorageService.removePendingOperationAt(0);
            }
          } else if (type == 'delete_file' && payload['fileId'] != null) {
            await _api.deleteFile(payload['fileId'] as String);
            await OfflineStorageService.removePendingOperationAt(0);
            successCount++;
          } else if (type == 'delete_folder' && payload['folderId'] != null) {
            await _api.deleteFolder(payload['folderId'] as String);
            await OfflineStorageService.removePendingOperationAt(0);
            successCount++;
          } else if (type == 'rename_file' &&
              payload['fileId'] != null &&
              payload['newName'] != null) {
            await _api.renameFile(
              payload['fileId'] as String,
              payload['newName'] as String,
            );
            await OfflineStorageService.removePendingOperationAt(0);
            successCount++;
          } else if (type == 'rename_folder' &&
              payload['folderId'] != null &&
              payload['newName'] != null) {
            await _api.renameFolder(
              payload['folderId'] as String,
              payload['newName'] as String,
            );
            await OfflineStorageService.removePendingOperationAt(0);
            successCount++;
          } else if (type == 'move_file' &&
              payload['fileId'] != null) {
            await _api.moveFile(
              payload['fileId'] as String,
              payload['folderId'] as String?,
            );
            await OfflineStorageService.removePendingOperationAt(0);
            successCount++;
          } else if (type == 'move_folder' &&
              payload['folderId'] != null) {
            await _api.moveFolder(
              payload['folderId'] as String,
              payload['parentId'] as String?,
            );
            await OfflineStorageService.removePendingOperationAt(0);
            successCount++;
          } else if (type == 'create_folder') {
            final name = payload['name'] as String?;
            final parentId = payload['parentId'] as String?;
            if (name != null) {
              final response = await _api.createFolder(name, parentId: parentId);
              if (response.statusCode == 201) {
                await OfflineStorageService.removePendingOperationAt(0);
                successCount++;
              } else {
                failCount++;
                break;
              }
            } else {
              await OfflineStorageService.removePendingOperationAt(0);
            }
          } else {
            await OfflineStorageService.removePendingOperationAt(0);
            failCount++;
          }
        } catch (e) {
          _lastError = e.toString();
          failCount++;
          break;
        }
      }

      notifyListeners();
      _isSyncing = false;
      notifyListeners();
      return SyncResult(
        success: failCount == 0,
        successCount: successCount,
        failCount: failCount,
      );
    } catch (e) {
      _lastError = e.toString();
      _isSyncing = false;
      notifyListeners();
      return SyncResult(success: false, reason: e.toString());
    }
  }

  /// Récupère les fichiers/dossiers depuis le serveur et les met en cache local
  Future<SyncResult> syncFromServer({String? folderId}) async {
    if (!_isOnline) {
      return SyncResult(success: false, reason: 'offline');
    }
    _isSyncing = true;
    notifyListeners();
    try {
      final response = await _api.listFiles(folderId: folderId, skip: 0, limit: 200);
      if (response.statusCode == 200) {
        final items = response.data['data']?['items'] as List<dynamic>? ?? [];
        for (final item in items) {
          if (item is! Map<String, dynamic>) continue;
          if (item['type'] == 'folder' || item['parent_id'] != null || item['folder_id'] == null) {
            try {
              await OfflineStorageService.saveFolderMap(item);
            } catch (_) {}
          } else {
            try {
              await OfflineStorageService.saveFileMap(item);
            } catch (_) {}
          }
        }
        await OfflineStorageService.setUserMeta('lastSyncDate', DateTime.now().toIso8601String());
      }
      _isSyncing = false;
      notifyListeners();
      return SyncResult(success: true);
    } catch (e) {
      _isSyncing = false;
      notifyListeners();
      return SyncResult(success: false, reason: e.toString());
    }
  }

  void notifyPendingChanged() {
    notifyListeners();
  }
}

class SyncResult {
  final bool success;
  final int successCount;
  final int failCount;
  final String? reason;

  SyncResult({
    required this.success,
    this.successCount = 0,
    this.failCount = 0,
    this.reason,
  });
}
