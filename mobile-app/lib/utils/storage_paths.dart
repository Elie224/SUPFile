import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

class StoragePaths {
  static Future<Directory> getWritableDirectory() async {
    if (kIsWeb) {
      throw Exception('Répertoire de stockage indisponible');
    }

    final candidates = <Future<Directory?>>[
      if (Platform.isAndroid) getExternalStorageDirectory(),
      getDownloadsDirectory(),
      getApplicationDocumentsDirectory(),
      getTemporaryDirectory(),
    ];

    for (final candidate in candidates) {
      try {
        final dir = await candidate;
        if (dir != null) {
          return dir;
        }
      } catch (_) {
      }
    }

    throw Exception('Répertoire de stockage indisponible');
  }
}
