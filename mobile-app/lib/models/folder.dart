class FolderItem {
  final String id;
  final String name;
  final String? parentId;
  final String ownerId;
  final bool isDeleted;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  FolderItem({
    required this.id,
    required this.name,
    this.parentId,
    required this.ownerId,
    required this.isDeleted,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory FolderItem.fromJson(Map<String, dynamic> json) {
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
      throw FormatException('FolderItem requires a valid id');
    }
    
    final name = json['name']?.toString() ?? '';
    if (name.isEmpty) {
      throw FormatException('FolderItem requires a valid name');
    }
    
    final ownerId = json['owner_id']?.toString() ?? '';
    if (ownerId.isEmpty) {
      throw FormatException('FolderItem requires a valid owner_id');
    }
    
    return FolderItem(
      id: id,
      name: name,
      parentId: json['parent_id']?.toString(),
      ownerId: ownerId,
      isDeleted: json['is_deleted'] == true,
      createdAt: parseDate(json['created_at']?.toString(), DateTime.now()),
      updatedAt: parseDate(json['updated_at']?.toString(), DateTime.now()),
    );
  }
  
  bool get isRoot => parentId == null;
}


