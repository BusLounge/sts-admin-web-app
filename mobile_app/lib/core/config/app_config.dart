import 'package:flutter/foundation.dart';

class AppConfig {
  static const String _definedBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (_definedBaseUrl.isNotEmpty) {
      return _definedBaseUrl;
    }

    if (kIsWeb) {
      return 'http://localhost:8083/api';
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:8083/api';
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      case TargetPlatform.fuchsia:
        return 'http://localhost:8083/api';
    }
  }
}