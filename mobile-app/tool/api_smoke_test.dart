// ignore_for_file: avoid_print

import 'dart:convert';

import 'package:dio/dio.dart';

String _truncate(Object? value, {int max = 800}) {
  final str = value is String ? value : const JsonEncoder.withIndent('  ').convert(value);
  if (str.length <= max) return str;
  return '${str.substring(0, max)}\n…(truncated, ${str.length} chars total)';
}

Future<void> main(List<String> args) async {
  final baseUrl = args.isNotEmpty && args.first.trim().isNotEmpty
      ? args.first.trim()
      : const String.fromEnvironment('API_BASE_URL', defaultValue: 'https://supfile.fly.dev');

  final healthDio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      headers: {
        'Accept': 'application/json',
        // Avoid brotli to reduce client-side decoding/parsing edge cases.
        'Accept-Encoding': 'gzip',
      },
      validateStatus: (s) => s != null && s < 600,
    ),
  );

  final apiDio = Dio(
    BaseOptions(
      baseUrl: '$baseUrl/api',
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 20),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
      },
      validateStatus: (s) => s != null && s < 600,
      responseType: ResponseType.json,
    ),
  );

  print('Base URL: $baseUrl');

  // 1) Health
  print('\n== GET /health ==');
  final health = await healthDio.get('/health');
  print('Status: ${health.statusCode}');
  print('Content-Type: ${health.headers.value('content-type')}');
  print('Body: ${_truncate(health.data)}');

  // 2) Signup
  final ts = DateTime.now().millisecondsSinceEpoch;
  final email = 'supfile+$ts@example.com';
  const password = 'Passw0rd!';

  print('\n== POST /api/auth/signup ==');
  final signup = await apiDio.post(
    '/auth/signup',
    data: {
      'email': email,
      'password': password,
    },
  );
  print('Email used: $email');
  print('Status: ${signup.statusCode}');
  print('Content-Type: ${signup.headers.value('content-type')}');
  print('Body: ${_truncate(signup.data)}');

  // 3) Login (expected to fail until email verification)
  print('\n== POST /api/auth/login (expected EMAIL_NOT_VERIFIED) ==');
  final login = await apiDio.post(
    '/auth/login',
    data: {
      'email': email,
      'password': password,
    },
  );
  print('Status: ${login.statusCode}');
  print('Content-Type: ${login.headers.value('content-type')}');
  print('Body: ${_truncate(login.data)}');

  // 4) Resend verification (optional)
  print('\n== POST /api/auth/resend-verification ==');
  final resend = await apiDio.post(
    '/auth/resend-verification',
    data: {'email': email},
  );
  print('Status: ${resend.statusCode}');
  print('Content-Type: ${resend.headers.value('content-type')}');
  print('Body: ${_truncate(resend.data)}');

  print('\nDone.');
}
