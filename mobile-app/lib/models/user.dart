class User {
  final String id;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final int quotaUsed;
  final int quotaLimit;
  final Map<String, dynamic>? preferences;
  final DateTime createdAt;
  final DateTime? lastLoginAt;
  final String? oauthProvider;
  
  User({
    required this.id,
    required this.email,
    this.displayName,
    this.avatarUrl,
    required this.quotaUsed,
    required this.quotaLimit,
    this.preferences,
    required this.createdAt,
    this.lastLoginAt,
    this.oauthProvider,
  });
  
  factory User.fromJson(Map<String, dynamic> json) {
    // Validation et parsing sécurisé des dates
    DateTime? parseDate(String? dateString) {
      if (dateString == null || dateString.isEmpty) return null;
      try {
        return DateTime.parse(dateString);
      } catch (e) {
        return null;
      }
    }
    
    // Validation des champs requis
    final id = json['id']?.toString() ?? json['_id']?.toString();
    if (id == null || id.isEmpty) {
      throw FormatException('User requires a valid id');
    }
    
    final email = json['email']?.toString() ?? '';
    if (email.isEmpty) {
      throw FormatException('User requires a valid email');
    }
    
    // Validation des quotas (doivent être >= 0)
    final quotaUsed = json['quota_used'] is int ? json['quota_used'] as int :
                      json['quota_used'] is String ? int.tryParse(json['quota_used']) ?? 0 : 0;
    final quotaLimit = json['quota_limit'] is int ? json['quota_limit'] as int :
                        json['quota_limit'] is String ? int.tryParse(json['quota_limit']) ?? 32212254720 :
                        32212254720;
    
    if (quotaUsed < 0 || quotaLimit < 0) {
      throw FormatException('User quotas must be >= 0');
    }
    
    return User(
      id: id,
      email: email,
      displayName: json['display_name']?.toString(),
      avatarUrl: json['avatar_url']?.toString(),
      quotaUsed: quotaUsed,
      quotaLimit: quotaLimit,
      preferences: json['preferences'] is Map ? json['preferences'] as Map<String, dynamic> : null,
      createdAt: parseDate(json['created_at']?.toString()) ?? DateTime.now(),
      lastLoginAt: parseDate(json['last_login_at']?.toString()),
      oauthProvider: json['oauth_provider']?.toString(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'display_name': displayName,
      'avatar_url': avatarUrl,
      'quota_used': quotaUsed,
      'quota_limit': quotaLimit,
      'preferences': preferences,
      'created_at': createdAt.toIso8601String(),
      'last_login_at': lastLoginAt?.toIso8601String(),
      'oauth_provider': oauthProvider,
    };
  }
  
  double get quotaPercentage => quotaLimit > 0 ? (quotaUsed / quotaLimit) * 100 : 0;
  int get quotaAvailable => quotaLimit - quotaUsed;
}


