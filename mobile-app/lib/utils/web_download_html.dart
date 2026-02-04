// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;
import 'dart:typed_data';

Future<void> saveBytesAsFileImpl({
  required List<int> bytes,
  required String fileName,
  required String mimeType,
}) async {
  final blob = html.Blob(<Object>[Uint8List.fromList(bytes)], mimeType);
  final url = html.Url.createObjectUrlFromBlob(blob);

  final anchor = html.AnchorElement(href: url)
    ..download = fileName
    ..style.display = 'none';

  html.document.body?.children.add(anchor);
  anchor.click();
  anchor.remove();

  html.Url.revokeObjectUrl(url);
}

void downloadFromUrlImpl({
  required String url,
  String? fileName,
}) {
  final anchor = html.AnchorElement(href: url)
    ..style.display = 'none';

  // Note: for cross-origin URLs, some browsers may ignore the `download` attribute.
  // The backend should still send Content-Disposition: attachment for /download.
  if (fileName != null && fileName.isNotEmpty) {
    anchor.download = fileName;
  }

  html.document.body?.children.add(anchor);
  anchor.click();
  anchor.remove();
}

String createObjectUrlFromBytesImpl({
  required List<int> bytes,
  required String mimeType,
}) {
  final blob = html.Blob(<Object>[Uint8List.fromList(bytes)], mimeType);
  return html.Url.createObjectUrlFromBlob(blob);
}

void revokeObjectUrlImpl(String url) {
  html.Url.revokeObjectUrl(url);
}
