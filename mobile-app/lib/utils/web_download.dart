import 'web_download_stub.dart'
    if (dart.library.html) 'web_download_html.dart';

/// Cross-platform entrypoint for triggering a file download.
///
/// - On Web: creates a Blob and triggers a browser download.
/// - On non-Web: throws (should not be called).
class WebDownload {
  static Future<void> saveBytesAsFile({
    required List<int> bytes,
    required String fileName,
    String mimeType = 'application/octet-stream',
  }) {
    return saveBytesAsFileImpl(bytes: bytes, fileName: fileName, mimeType: mimeType);
  }

  /// Web-only: triggers a browser download directly from a URL.
  ///
  /// Prefer this for large files (e.g. videos) to avoid loading all bytes into memory.
  /// On non-web platforms, this throws.
  static void downloadFromUrl({
    required String url,
    String? fileName,
  }) {
    return downloadFromUrlImpl(url: url, fileName: fileName);
  }

  /// Web-only: creates an object URL (blob:) from bytes for in-browser preview.
  ///
  /// On non-web platforms, this throws.
  static String createObjectUrlFromBytes({
    required List<int> bytes,
    String mimeType = 'application/octet-stream',
  }) {
    return createObjectUrlFromBytesImpl(bytes: bytes, mimeType: mimeType);
  }

  /// Web-only: revokes an object URL created by [createObjectUrlFromBytes].
  static void revokeObjectUrl(String url) {
    revokeObjectUrlImpl(url);
  }
}
