class ShareItem {
  final String id;
  final String? fileId;
  final String? folderId;
  final String? createdById;
  final String shareType;
  final String? publicToken;
  final bool requiresPassword;
  final DateTime? expiresAt;
  final String? sharedWithUserId;
  final bool isActive;
  final int accessCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ShareItem({
    required this.id,
    this.fileId,
    this.folderId,
    this.createdById,
    required this.shareType,
    this.publicToken,
    required this.requiresPassword,
    this.expiresAt,
    this.sharedWithUserId,
    required this.isActive,
    required this.accessCount,
    this.createdAt,
    this.updatedAt,
  });

  factory ShareItem.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      final text = value.toString();
      if (text.isEmpty) return null;
      try {
        return DateTime.parse(text);
      } catch (_) {
        return null;
      }
    }

    final id = json['id']?.toString() ?? json['_id']?.toString();
    if (id == null || id.isEmpty) {
      throw const FormatException('ShareItem requires a valid id');
    }

    return ShareItem(
      id: id,
      fileId: json['file_id']?.toString(),
      folderId: json['folder_id']?.toString(),
      createdById: json['created_by_id']?.toString(),
      shareType: json['share_type']?.toString() ?? 'public',
      publicToken: json['public_token']?.toString(),
      requiresPassword: json['requires_password'] == true,
      expiresAt: parseDate(json['expires_at']),
      sharedWithUserId: json['shared_with_user_id']?.toString(),
      isActive: json['is_active'] != false,
      accessCount: json['access_count'] is int
          ? json['access_count'] as int
          : int.tryParse(json['access_count']?.toString() ?? '') ?? 0,
      createdAt: parseDate(json['created_at']),
      updatedAt: parseDate(json['updated_at']),
    );
  }

  bool get isFileShare => fileId != null && fileId!.isNotEmpty;
  bool get isFolderShare => folderId != null && folderId!.isNotEmpty;
}
