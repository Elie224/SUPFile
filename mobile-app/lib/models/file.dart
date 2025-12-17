class FileItem {
  final String id;
  final String name;
  final String? mimeType;
  final int size;
  final String? folderId;
  final String ownerId;
  final String? filePath;
  final bool isDeleted;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  FileItem({
    required this.id,
    required this.name,
    this.mimeType,
    required this.size,
    this.folderId,
    required this.ownerId,
    this.filePath,
    required this.isDeleted,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory FileItem.fromJson(Map<String, dynamic> json) {
    // Validation et parsing sécurisé des dates
    DateTime parseDate(String? dateString, DateTime fallback) {
      if (dateString == null || dateString.isEmpty) return fallback;
      try {
        return DateTime.parse(dateString);
      } catch (e) {
        return fallback;
      }
    }
    
    // Validation des champs requis
    final id = json['id']?.toString() ?? json['_id']?.toString();
    if (id == null || id.isEmpty) {
      throw FormatException('FileItem requires a valid id');
    }
    
    final name = json['name']?.toString() ?? '';
    if (name.isEmpty) {
      throw FormatException('FileItem requires a valid name');
    }
    
    final ownerId = json['owner_id']?.toString() ?? '';
    if (ownerId.isEmpty) {
      throw FormatException('FileItem requires a valid owner_id');
    }
    
    // Validation de la taille (doit être >= 0)
    final size = json['size'] is int ? json['size'] as int : 
                 json['size'] is String ? int.tryParse(json['size']) ?? 0 : 0;
    if (size < 0) {
      throw FormatException('FileItem size must be >= 0');
    }
    
    return FileItem(
      id: id,
      name: name,
      mimeType: json['mime_type']?.toString(),
      size: size,
      folderId: json['folder_id']?.toString(),
      ownerId: ownerId,
      filePath: json['file_path']?.toString(),
      isDeleted: json['is_deleted'] == true,
      createdAt: parseDate(json['created_at']?.toString(), DateTime.now()),
      updatedAt: parseDate(json['updated_at']?.toString(), DateTime.now()),
    );
  }
  
  bool get isImage => mimeType?.startsWith('image/') ?? false;
  bool get isVideo => mimeType?.startsWith('video/') ?? false;
  bool get isAudio => mimeType?.startsWith('audio/') ?? false;
  bool get isPdf => mimeType == 'application/pdf';
  bool get isText => mimeType?.startsWith('text/') ?? false;
  
  String get formattedSize {
    if (size < 1024) return '$size B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(2)} KB';
    if (size < 1024 * 1024 * 1024) return '${(size / (1024 * 1024)).toStringAsFixed(2)} MB';
    return '${(size / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
  
  DateTime? get modifiedAt => updatedAt;
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      '_id': id,
      'name': name,
      'mime_type': mimeType,
      'size': size,
      'folder_id': folderId,
      'owner_id': ownerId,
      'file_path': filePath,
      'is_deleted': isDeleted,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}


