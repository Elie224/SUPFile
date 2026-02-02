import 'dart:convert';
import 'dart:typed_data';
import 'dart:io';

import 'package:dio/dio.dart';

String _truncate(Object? value, {int max = 900}) {
  try {
    final str = value is String ? value : const JsonEncoder.withIndent('  ').convert(value);
    if (str.length <= max) return str;
    return '${str.substring(0, max)}\n…(truncated, ${str.length} chars total)';
  } catch (_) {
    final str = value?.toString() ?? '';
    if (str.length <= max) return str;
    return '${str.substring(0, max)}\n…(truncated, ${str.length} chars total)';
  }
}

Future<Response<dynamic>> _request(
  Dio dio,
  Future<Response<dynamic>> Function() fn, {
  required String label,
  bool verboseOnError = true,
}) async {
  try {
    final res = await fn();
    stdout.writeln('$label -> ${res.statusCode}');
    if ((res.statusCode ?? 0) >= 400 && verboseOnError) {
      stdout.writeln('  body: ${_truncate(res.data)}');
    }
    return res;
  } on DioException catch (e) {
    stdout.writeln('$label -> DioException: ${e.type}');
    if (e.response != null) {
      stdout.writeln('  status: ${e.response?.statusCode}');
      stdout.writeln('  body: ${_truncate(e.response?.data)}');
    } else {
      stdout.writeln('  message: ${e.message}');
    }
    rethrow;
  }
}

Uint8List _tinyPngBytes() {
  // A valid 1x1 transparent PNG.
  return Uint8List.fromList(<int>[
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89,
    0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54,
    0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05,
    0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82,
  ]);
}

String? _pickToken(Map<String, dynamic>? json) {
  if (json == null) return null;
  final data = json['data'];
  if (data is Map) {
    final access = data['access_token']?.toString();
    if (access != null && access.isNotEmpty) return access;
  }
  return null;
}

Future<void> main(List<String> args) async {
  final baseUrl = args.isNotEmpty && args.first.trim().isNotEmpty
      ? args.first.trim()
      : (Platform.environment['SUPFILE_BASE_URL']?.trim().isNotEmpty == true
          ? Platform.environment['SUPFILE_BASE_URL']!.trim()
          : 'https://supfile.fly.dev');

  final email = (args.length >= 2 ? args[1].trim() : (Platform.environment['SUPFILE_EMAIL'] ?? '').trim());
  final password = (args.length >= 3 ? args[2] : (Platform.environment['SUPFILE_PASSWORD'] ?? ''));

  if (email.isEmpty || password.isEmpty) {
    stdout.writeln('Missing credentials. Provide either:');
    stdout.writeln('  - args: dart run tool/api_full_smoke_test.dart <baseUrl> <email> <password>');
    stdout.writeln('  - OR env vars: SUPFILE_EMAIL and SUPFILE_PASSWORD (optional SUPFILE_BASE_URL)');
    exitCode = 2;
    return;
  }

  stdout.writeln('Base URL: $baseUrl');
  stdout.writeln('Email: $email');

  final healthDio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
      },
      validateStatus: (s) => s != null && s < 600,
    ),
  );

  final apiDio = Dio(
    BaseOptions(
      baseUrl: '$baseUrl/api',
      connectTimeout: const Duration(seconds: 25),
      receiveTimeout: const Duration(seconds: 25),
      sendTimeout: const Duration(seconds: 25),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
      },
      validateStatus: (s) => s != null && s < 600,
      responseType: ResponseType.json,
    ),
  );

  // 1) Health
  await _request(
    healthDio,
    () => healthDio.get('/health'),
    label: 'GET /health',
    verboseOnError: true,
  );

  // 2) Login
  final loginRes = await _request(
    apiDio,
    () => apiDio.post('/auth/login', data: {'email': email, 'password': password}),
    label: 'POST /api/auth/login',
    verboseOnError: true,
  );

  final loginJson = loginRes.data is Map<String, dynamic>
      ? (loginRes.data as Map<String, dynamic>)
      : (loginRes.data is Map ? Map<String, dynamic>.from(loginRes.data as Map) : null);

  final accessToken = _pickToken(loginJson);
  if (loginRes.statusCode != 200 || accessToken == null) {
    stdout.writeln('Login failed or token missing. Body: ${_truncate(loginRes.data)}');
    exitCode = 1;
    return;
  }

  // Attach auth
  apiDio.options.headers['Authorization'] = 'Bearer $accessToken';

  // 3) Dashboard + Me
  await _request(apiDio, () => apiDio.get('/users/me'), label: 'GET /api/users/me');
  await _request(apiDio, () => apiDio.get('/dashboard'), label: 'GET /api/dashboard');

  // 4) List root files
  final rootFiles = await _request(apiDio, () => apiDio.get('/files', queryParameters: {'skip': 0, 'limit': 50}), label: 'GET /api/files (root)');

  // 5) Create folder
  final ts = DateTime.now().millisecondsSinceEpoch;
  final folderName = 'SmokeTest_$ts';
  final createFolderRes = await _request(apiDio, () => apiDio.post('/folders', data: {'name': folderName}), label: 'POST /api/folders (create "$folderName")');

  final folderId = (createFolderRes.data is Map && (createFolderRes.data as Map)['data'] is Map)
      ? ((createFolderRes.data as Map)['data']['id']?.toString())
      : null;
  if (createFolderRes.statusCode != 201 || folderId == null) {
    stdout.writeln('Folder create failed. Body: ${_truncate(createFolderRes.data)}');
    exitCode = 1;
    return;
  }

  // 6) Upload file into folder
  final tmpDir = await Directory.systemTemp.createTemp('supfile_smoke_');
  final uploadFile = File('${tmpDir.path}${Platform.pathSeparator}hello-$ts.txt');
  await uploadFile.writeAsString('Hello SUPFile smoke test @ $ts\n');

  final uploadForm = FormData.fromMap({
    'file': await MultipartFile.fromFile(uploadFile.path, filename: uploadFile.uri.pathSegments.last),
    'folder_id': folderId,
  });

  final uploadRes = await _request(
    apiDio,
    () => apiDio.post('/files/upload', data: uploadForm),
    label: 'POST /api/files/upload (folder_id=$folderId)',
  );

  final uploadedFileId = (uploadRes.data is Map && (uploadRes.data as Map)['data'] is Map)
      ? ((uploadRes.data as Map)['data']['id']?.toString())
      : null;

  // 6b) Fetch file metadata + download bytes
  if (uploadedFileId != null) {
    await _request(apiDio, () => apiDio.get('/files/$uploadedFileId'), label: 'GET /api/files/$uploadedFileId');
    final downloadRes = await _request(
      apiDio,
      () => apiDio.get(
        '/files/$uploadedFileId/download',
        options: Options(
          responseType: ResponseType.bytes,
          headers: const {'Cache-Control': 'no-cache'},
        ),
      ),
      label: 'GET /api/files/$uploadedFileId/download',
      verboseOnError: true,
    );
    if (downloadRes.statusCode == 200 && downloadRes.data is List<int>) {
      stdout.writeln('  download bytes=${(downloadRes.data as List<int>).length}');
    }
  }

  // 6c) Upload a tiny PNG image file and test preview sizes
  final imageFile = File('${tmpDir.path}${Platform.pathSeparator}tiny-$ts.png');
  await imageFile.writeAsBytes(_tinyPngBytes());
  final imageUploadForm = FormData.fromMap({
    'file': await MultipartFile.fromFile(imageFile.path, filename: imageFile.uri.pathSegments.last),
    'folder_id': folderId,
  });
  final imageUploadRes = await _request(
    apiDio,
    () => apiDio.post('/files/upload', data: imageUploadForm),
    label: 'POST /api/files/upload (image, folder_id=$folderId)',
  );
  final uploadedImageId = (imageUploadRes.data is Map && (imageUploadRes.data as Map)['data'] is Map)
      ? ((imageUploadRes.data as Map)['data']['id']?.toString())
      : null;
  if (uploadedImageId != null) {
    for (final size in const ['small', 'medium', 'large']) {
      final previewRes = await _request(
        apiDio,
        () => apiDio.get('/files/$uploadedImageId/preview', queryParameters: {'size': size}),
        label: 'GET /api/files/$uploadedImageId/preview?size=$size',
        verboseOnError: true,
      );
      if (previewRes.statusCode == 200 && previewRes.data is Map) {
        final data = (previewRes.data as Map)['data'];
        if (data is Map) {
          final mimeType = data['mime_type']?.toString();
          final content = data['content']?.toString();
          if (content != null && content.isNotEmpty) {
            final decoded = base64Decode(content);
            stdout.writeln('  image preview size=$size mime=$mimeType bytes=${decoded.length}');
          }
        }
      }
    }
  }

  // 7) List folder
  await _request(apiDio, () => apiDio.get('/files', queryParameters: {'folder_id': folderId, 'skip': 0, 'limit': 50}), label: 'GET /api/files (folder)');

  // 8) Rename uploaded file (if we got id)
  if (uploadedFileId != null) {
    final newName = 'hello-renamed-$ts.txt';
    await _request(apiDio, () => apiDio.patch('/files/$uploadedFileId', data: {'name': newName}), label: 'PATCH /api/files/$uploadedFileId (rename)');

    // 8a) Move file to root then back to folder (tests "update" behaviors used by the UI)
    await _request(apiDio, () => apiDio.patch('/files/$uploadedFileId', data: {'folder_id': null}), label: 'PATCH /api/files/$uploadedFileId (move to root)');
    await _request(apiDio, () => apiDio.patch('/files/$uploadedFileId', data: {'folder_id': folderId}), label: 'PATCH /api/files/$uploadedFileId (move back)');

    // 8b) Preview (base64 JSON) - should work for text files
    final previewRes = await _request(
      apiDio,
      () => apiDio.get('/files/$uploadedFileId/preview'),
      label: 'GET /api/files/$uploadedFileId/preview',
      verboseOnError: true,
    );

    if (previewRes.statusCode == 200 && previewRes.data is Map) {
      final data = (previewRes.data as Map)['data'];
      if (data is Map) {
        final mimeType = data['mime_type']?.toString();
        final content = data['content']?.toString();
        if (content != null && content.isNotEmpty) {
          try {
            final decoded = base64Decode(content);
            stdout.writeln('  preview mime=$mimeType bytes=${decoded.length}');
          } catch (e) {
            stdout.writeln('  preview base64 decode failed: $e');
            exitCode = 1;
            return;
          }
        }
      }
    }
  }

  // 9) Search
  await _request(apiDio, () => apiDio.get('/search', queryParameters: {'q': 'hello', 'limit': 50}), label: 'GET /api/search?q=hello');

  // 10) Create public share (file preferred)
  String? publicShareToken;
  if (uploadedFileId != null) {
    final shareRes = await _request(apiDio, () => apiDio.post('/share/public', data: {'file_id': uploadedFileId}), label: 'POST /api/share/public (file)');
    publicShareToken = (shareRes.data is Map && (shareRes.data as Map)['data'] is Map)
        ? ((shareRes.data as Map)['data']['token']?.toString())
        : null;
  } else {
    final shareRes = await _request(apiDio, () => apiDio.post('/share/public', data: {'folder_id': folderId}), label: 'POST /api/share/public (folder)');
    publicShareToken = (shareRes.data is Map && (shareRes.data as Map)['data'] is Map)
        ? ((shareRes.data as Map)['data']['token']?.toString())
        : null;
  }

  if (publicShareToken != null) {
    final publicDio = Dio(
      BaseOptions(
        baseUrl: '$baseUrl/api',
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Accept': 'application/json', 'Accept-Encoding': 'gzip'},
        validateStatus: (s) => s != null && s < 600,
      ),
    );
    await _request(publicDio, () => publicDio.get('/share/$publicShareToken'), label: 'GET /api/share/<token> (public)');
  }

  // 11) Trash flow: delete file then list trash then restore
  if (uploadedFileId != null) {
    await _request(apiDio, () => apiDio.delete('/files/$uploadedFileId'), label: 'DELETE /api/files/$uploadedFileId (move to trash)');
    await _request(apiDio, () => apiDio.get('/files/trash'), label: 'GET /api/files/trash');
    await _request(apiDio, () => apiDio.post('/files/$uploadedFileId/restore'), label: 'POST /api/files/$uploadedFileId/restore');
  }

  // 12) Avatar upload
  final avatarFile = File('${tmpDir.path}${Platform.pathSeparator}avatar-$ts.png');
  await avatarFile.writeAsBytes(_tinyPngBytes());
  final avatarForm = FormData.fromMap({
    'avatar': await MultipartFile.fromFile(avatarFile.path, filename: avatarFile.uri.pathSegments.last),
  });
  await _request(apiDio, () => apiDio.post('/users/me/avatar', data: avatarForm), label: 'POST /api/users/me/avatar');
  await _request(apiDio, () => apiDio.get('/users/me'), label: 'GET /api/users/me (after avatar)');

  // 13) Preferences update
  await _request(
    apiDio,
    () => apiDio.patch('/users/me/preferences', data: {
      'preferences': {
        'smoke_test_ts': ts,
        'smoke_test_device': 'cli',
      }
    }),
    label: 'PATCH /api/users/me/preferences',
  );

  // 14) Cleanup: delete folder (goes to trash) then delete again to hard delete (depends on backend logic)
  await _request(apiDio, () => apiDio.delete('/folders/$folderId'), label: 'DELETE /api/folders/$folderId (to trash)');
  await _request(apiDio, () => apiDio.get('/folders/trash'), label: 'GET /api/folders/trash');
  // Attempt permanent delete (same endpoint on already-deleted items in this backend)
  await _request(apiDio, () => apiDio.delete('/folders/$folderId'), label: 'DELETE /api/folders/$folderId (permanent)');

  // Best-effort: if file exists, try permanent delete too
  if (uploadedFileId != null) {
    await _request(apiDio, () => apiDio.delete('/files/$uploadedFileId'), label: 'DELETE /api/files/$uploadedFileId (permanent attempt)');
  }

  stdout.writeln('Done. Root list status was ${rootFiles.statusCode}.');
}
