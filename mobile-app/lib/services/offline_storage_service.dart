import 'package:hive_flutter/hive_flutter.dart';
import '../models/file.dart';
import '../models/folder.dart';

/// Stockage local pour le mode hors ligne (fichiers, dossiers, file d'opérations).
class OfflineStorageService {
  static const String _boxFiles = 'offline_files';
  static const String _boxFolders = 'offline_folders';
  static const String _boxPendingOps = 'pending_operations';
  static const String _boxUserMeta = 'offline_user_meta';

  static Box<dynamic>? _filesBox;
  static Box<dynamic>? _foldersBox;
  static Box<dynamic>? _pendingBox;
  static Box<dynamic>? _metaBox;

  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized) return;
    await Hive.initFlutter();
    if (!Hive.isBoxOpen(_boxFiles)) {
      _filesBox = await Hive.openBox(_boxFiles);
    } else {
      _filesBox = Hive.box(_boxFiles);
    }
    if (!Hive.isBoxOpen(_boxFolders)) {
      _foldersBox = await Hive.openBox(_boxFolders);
    } else {
      _foldersBox = Hive.box(_boxFolders);
    }
    if (!Hive.isBoxOpen(_boxPendingOps)) {
      _pendingBox = await Hive.openBox(_boxPendingOps);
    } else {
      _pendingBox = Hive.box(_boxPendingOps);
    }
    if (!Hive.isBoxOpen(_boxUserMeta)) {
      _metaBox = await Hive.openBox(_boxUserMeta);
    } else {
      _metaBox = Hive.box(_boxUserMeta);
    }
    _initialized = true;
  }

  static Box<dynamic> get _files => _filesBox ??= Hive.box(_boxFiles);
  static Box<dynamic> get _folders => _foldersBox ??= Hive.box(_boxFolders);
  static Box<dynamic> get _pending => _pendingBox ??= Hive.box(_boxPendingOps);
  static Box<dynamic> get _meta => _metaBox ??= Hive.box(_boxUserMeta);

  static Future<void> saveFile(FileItem file) async {
    await init();
    await _files.put(file.id, file.toJson());
  }

  static Future<void> saveFileMap(Map<String, dynamic> fileMap) async {
    await init();
    final id = fileMap['id']?.toString() ?? fileMap['_id']?.toString();
    if (id != null) await _files.put(id, Map<String, dynamic>.from(fileMap));
  }

  static Future<void> saveFolder(FolderItem folder) async {
    await init();
    await _folders.put(folder.id, folder.toJson());
  }

  static Future<void> saveFolderMap(Map<String, dynamic> folderMap) async {
    await init();
    final id = folderMap['id']?.toString() ?? folderMap['_id']?.toString();
    if (id != null) await _folders.put(id, folderMap);
  }

  static Future<void> deleteFile(String fileId) async {
    await init();
    await _files.delete(fileId);
  }

  static Future<void> deleteFolder(String folderId) async {
    await init();
    await _folders.delete(folderId);
  }

  static List<FileItem> getFilesByFolder(String? folderId) {
    if (!_initialized) return [];
    final all = _files.values.toList();
    final list = <FileItem>[];
    for (final v in all) {
      final map = Map<String, dynamic>.from(v as Map);
      final fId = map['folder_id']?.toString();
      if (folderId == null && (fId == null || fId.isEmpty)) {
        try {
          list.add(FileItem.fromJson(map));
        } catch (_) {}
      } else if (fId == folderId) {
        try {
          list.add(FileItem.fromJson(map));
        } catch (_) {}
      }
    }
    return list;
  }

  static List<FolderItem> getFoldersByParent(String? parentId) {
    if (!_initialized) return [];
    final all = _folders.values.toList();
    final list = <FolderItem>[];
    for (final v in all) {
      final map = Map<String, dynamic>.from(v as Map<dynamic, dynamic>);
      final pId = map['parent_id']?.toString();
      if (parentId == null && (pId == null || pId.isEmpty)) {
        try {
          list.add(FolderItem.fromJson(map));
        } catch (_) {}
      } else if (pId == parentId) {
        try {
          list.add(FolderItem.fromJson(map));
        } catch (_) {}
      }
    }
    return list;
  }

  static List<FileItem> getAllFiles() {
    if (!_initialized) return [];
    final all = _files.values.toList();
    final list = <FileItem>[];
    for (final v in all) {
      try {
        list.add(FileItem.fromJson(Map<String, dynamic>.from(v as Map<dynamic, dynamic>)));
      } catch (_) {}
    }
    return list;
  }

  static List<FolderItem> getAllFolders() {
    if (!_initialized) return [];
    final all = _folders.values.toList();
    final list = <FolderItem>[];
    for (final v in all) {
      try {
        list.add(FolderItem.fromJson(Map<String, dynamic>.from(v as Map<dynamic, dynamic>)));
      } catch (_) {}
    }
    return list;
  }

  static List<Map<String, dynamic>> getPendingOperations() {
    if (!_initialized) return [];
    const key = 'ops';
    final raw = _pending.get(key);
    if (raw == null) return [];
    if (raw is List) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map<dynamic, dynamic>)).toList();
    }
    return [];
  }

  static Future<void> addPendingOperation(String type, Map<String, dynamic> payload) async {
    await init();
    const key = 'ops';
    final list = getPendingOperations();
    list.add({
      'type': type,
      'payload': payload,
      'createdAt': DateTime.now().toIso8601String(),
    });
    await _pending.put(key, list);
  }

  static Future<void> removePendingOperationAt(int index) async {
    final list = getPendingOperations();
    if (index < 0 || index >= list.length) return;
    list.removeAt(index);
    await _pending.put('ops', list);
  }

  static Future<void> setUserMeta(String key, dynamic value) async {
    await init();
    await _meta.put(key, value);
  }

  static dynamic getUserMeta(String key) {
    if (!_initialized) return null;
    return _meta.get(key);
  }

  static Future<void> clearAll() async {
    await init();
    await _files.clear();
    await _folders.clear();
    await _pending.clear();
    await _meta.clear();
  }
}
