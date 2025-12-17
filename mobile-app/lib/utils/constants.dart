class AppConstants {
  // API Configuration
  static const String apiBaseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:5000',
  );
  
  static const String apiUrl = '$apiBaseUrl/api';
  
  // Storage Keys
  static const String storageAccessToken = 'access_token';
  static const String storageRefreshToken = 'refresh_token';
  static const String storageUser = 'user';
  
  // File Upload
  static const int maxFileSize = 32212254720; // 30 GB
  static const int maxImageSize = 5242880; // 5 MB pour les avatars
  
  // Colors - Palette SUPINFO
  static const Color supinfoPurple = Color(0xFF502A88);
  static const Color supinfoPurpleLight = Color(0xFF6B3FA8);
  static const Color supinfoPurpleDark = Color(0xFF3D1F66);
  static const Color supinfoWhite = Color(0xFFFFFFFF);
  static const Color supinfoGrey = Color(0xFFF5F5F5);
  static const Color supinfoGreyDark = Color(0xFF757575);
  
  // Couleurs système
  static const Color successColor = Color(0xFF4CAF50);
  static const Color errorColor = Color(0xFFE53935);
  static const Color warningColor = Color(0xFFFF9800);
  static const Color infoColor = Color(0xFF2196F3);
  
  // Quota
  static const int defaultQuotaLimit = 32212254720; // 30 GB
}





