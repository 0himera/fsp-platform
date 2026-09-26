library;

class ApiConfig {
  const ApiConfig({
    String? baseUrl,
    this.timeout = const Duration(seconds: 15),
  }) : instanceBaseUrl = baseUrl;

  static const String defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.8.1.8:3000',
  );

  static String? customBaseUrl;

  static String get currentBaseUrl => customBaseUrl ?? defaultBaseUrl;

  static void setBaseUrl(String url) {
    customBaseUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
  }

  final String? instanceBaseUrl;

  String get baseUrl => instanceBaseUrl ?? currentBaseUrl;

  final Duration timeout;
}
