Future<void> saveBytesAsFileImpl({
  required List<int> bytes,
  required String fileName,
  required String mimeType,
}) async {
  throw UnsupportedError('Web download is not available on this platform');
}

void downloadFromUrlImpl({
  required String url,
  String? fileName,
}) {
  throw UnsupportedError('Web download is not available on this platform');
}

String createObjectUrlFromBytesImpl({
  required List<int> bytes,
  required String mimeType,
}) {
  throw UnsupportedError('Web object URLs are not available on this platform');
}

void revokeObjectUrlImpl(String url) {
  // no-op on non-web
}
