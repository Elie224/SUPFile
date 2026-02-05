import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:integration_test/integration_test.dart';

import 'package:supfile_mobile/main.dart' as app;
import 'package:supfile_mobile/services/api_service.dart';

List<int> _tinyPngBytes() {
  // A valid 1x1 transparent PNG.
  return <int>[
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
  ];
}

Future<void> _pumpSettled(WidgetTester tester, {Duration timeout = const Duration(seconds: 25)}) async {
  // Avoid relying on pumpAndSettle's API surface (varies across Flutter versions).
  // Instead, pump frames until nothing is scheduled or until we hit timeout.
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 100));
    if (!tester.binding.hasScheduledFrame) {
      await tester.pump();
      return;
    }
  }
  // Give the framework one last chance to flush microtasks.
  await tester.pump();
}

GoRouter _routerOf(WidgetTester tester) {
  final element = tester.element(find.byType(MaterialApp));
  return GoRouter.of(element);
}

Future<void> _go(WidgetTester tester, String location, {Object? extra}) async {
  final router = _routerOf(tester);
  router.go(location, extra: extra);
  await _pumpSettled(tester);

  final error = tester.takeException();
  if (error != null) {
    throw TestFailure('Exception after navigating to $location: $error');
  }
}

Future<void> _login(WidgetTester tester) async {
  final email = (Platform.environment['SUPFILE_EMAIL'] ?? '').trim();
  final password = Platform.environment['SUPFILE_PASSWORD'] ?? '';
  final twoFaCode = (Platform.environment['SUPFILE_2FA_CODE'] ?? '').trim();

  if (email.isEmpty || password.isEmpty) {
    throw TestFailure(
      'Missing credentials. Set env vars SUPFILE_EMAIL and SUPFILE_PASSWORD before running this test.',
    );
  }

  await _go(tester, '/login');

  // Login screen uses exactly two TextFormFields (email then password).
  final loginFields = find.byType(TextFormField);
  expect(loginFields, findsAtLeastNWidgets(2));
  await tester.enterText(loginFields.at(0), email);
  await tester.enterText(loginFields.at(1), password);
  await tester.tap(find.text('Connexion'));
  await _pumpSettled(tester, timeout: const Duration(seconds: 40));

  // Optional 2FA step.
  final twoFaTitle = find.text('Code de vérification');
  if (twoFaTitle.evaluate().isNotEmpty) {
    if (twoFaCode.isEmpty) {
      throw TestFailure(
        'Account requires 2FA. Set SUPFILE_2FA_CODE to a valid 2FA/backup code and rerun.',
      );
    }

    final codeField = find.byType(TextFormField);
    expect(codeField, findsAtLeastNWidgets(1));
    await tester.enterText(codeField.first, twoFaCode);
    await tester.tap(find.text('Vérifier'));
    await _pumpSettled(tester, timeout: const Duration(seconds: 40));
  }

  // After successful login, router redirect should land on dashboard.
  // We don't assert specific UI strings (to avoid brittleness), but we do assert no exception.
  final error = tester.takeException();
  if (error != null) {
    throw TestFailure('Exception after login: $error');
  }
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Deep app smoke: login + navigate all routes', (tester) async {
    // Boot app
    app.main();
    await _pumpSettled(tester, timeout: const Duration(seconds: 30));

    // Public routes
    await _go(tester, '/');
    await _go(tester, '/login');
    await _go(tester, '/signup');
    await _go(tester, '/forgot-password');
    await _go(tester, '/reset-password?token=invalid');
    await _go(tester, '/verify-email?token=invalid');

    // Auth
    await _login(tester);

    // API-backed setup for parameterized routes.
    final api = ApiService();
    final ts = DateTime.now().millisecondsSinceEpoch;

    final folderRes = await api.createFolder('IT_DeepTest_$ts');
    expect(folderRes.statusCode, anyOf(200, 201));
    final folderId = (folderRes.data is Map && (folderRes.data as Map)['data'] is Map)
      ? ((folderRes.data as Map)['data']['id']?.toString())
      : null;

    // Upload a tiny text file + image so we can exercise preview/gallery/share routes.
    String? uploadedTextId;
    String? uploadedImageId;
    Map<String, dynamic>? uploadedImageJson;
    if (folderId != null && folderId.isNotEmpty) {
      final tmpDir = await Directory.systemTemp.createTemp('supfile_it_');

      final textFile = File('${tmpDir.path}${Platform.pathSeparator}it-hello-$ts.txt');
      await textFile.writeAsString('Integration smoke test @ $ts\n');
      final textUploadRes = await api.uploadFile(textFile, folderId: folderId);
      uploadedTextId = (textUploadRes.data is Map && (textUploadRes.data as Map)['data'] is Map)
        ? ((textUploadRes.data as Map)['data']['id']?.toString())
        : null;

      final imageFile = File('${tmpDir.path}${Platform.pathSeparator}it-tiny-$ts.png');
      await imageFile.writeAsBytes(_tinyPngBytes());
      final imageUploadRes = await api.uploadFile(imageFile, folderId: folderId);
      uploadedImageId = (imageUploadRes.data is Map && (imageUploadRes.data as Map)['data'] is Map)
        ? ((imageUploadRes.data as Map)['data']['id']?.toString())
        : null;

      if (uploadedImageId != null && uploadedImageId.isNotEmpty) {
      final imageMetaRes = await api.getFile(uploadedImageId);
      uploadedImageJson = (imageMetaRes.data is Map && (imageMetaRes.data as Map)['data'] is Map)
        ? Map<String, dynamic>.from((imageMetaRes.data as Map)['data'] as Map)
        : null;
      }
    }

    // Private routes
    await _go(tester, '/dashboard');
    await _go(tester, '/files');
    if (folderId != null && folderId.isNotEmpty) {
      await _go(tester, '/files?folder=$folderId');
    }
    await _go(tester, '/search');
    await _go(tester, '/settings');
    await _go(tester, '/trash');
    if (uploadedTextId != null && uploadedTextId.isNotEmpty) {
      await _go(tester, '/share?file=$uploadedTextId');
    } else {
      await _go(tester, '/share');
    }
    await _go(tester, '/shares');
    await _go(tester, '/admin');

    // Parameterized routes
    if (uploadedTextId != null && uploadedTextId.isNotEmpty) {
      await _go(tester, '/preview/$uploadedTextId');

      // Create a public share and open the public share page inside the app.
      final shareRes = await api.createPublicShare(fileId: uploadedTextId);
      final token = (shareRes.data is Map && (shareRes.data as Map)['data'] is Map)
          ? ((shareRes.data as Map)['data']['token']?.toString())
          : null;
      if (token != null && token.isNotEmpty) {
        await _go(tester, '/share/$token');
      }

      // Trash + restore (keeps the account clean).
      await api.deleteFile(uploadedTextId);
      await api.listTrashFiles();
      await api.restoreFile(uploadedTextId);
    }

    if (uploadedImageId != null && uploadedImageId.isNotEmpty) {
      await _go(tester, '/preview/$uploadedImageId');

      if (uploadedImageJson != null) {
        await _go(
          tester,
          '/gallery?index=0',
          extra: <dynamic>[uploadedImageJson],
        );
      }
    }

    // Best-effort cleanup (non-fatal).
    if (folderId != null && folderId.isNotEmpty) {
      try {
        if (uploadedTextId != null && uploadedTextId.isNotEmpty) {
          try {
            await api.deleteFile(uploadedTextId);
          } catch (_) {
            // ignore
          }
        }
        if (uploadedImageId != null && uploadedImageId.isNotEmpty) {
          try {
            await api.deleteFile(uploadedImageId);
          } catch (_) {
            // ignore
          }
        }
        await api.deleteFolder(folderId);
      } catch (_) {
        // Ignore cleanup failures in smoke test.
      }
    }
  });
}
