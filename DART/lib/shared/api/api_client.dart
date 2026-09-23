/// Единственная точка выхода в сеть.
///
/// ЗАЧЕМ ОН НУЖЕН: чтобы ни один сервис, контроллер или виджет не трогал
/// `http` напрямую. Тогда на весь проект один код, который:
///  • подставляет cookie сессии и забирает её из ответа;
///  • сериализует тело в JSON и разбирает ошибку сервера;
///  • превращает сетевые сбои в `ApiFailure` (а не в непойманное исключение).
///
/// ПОДКАСТ ПРО CSRF: бэкенд для POST/PUT/PATCH/DELETE сравнивает заголовок
/// `Origin` с хостом запроса и отдаёт 403 при несовпадении (защита от браузерных
/// межсайтовых запросов). Мы — не браузер и `Origin` не отправляем, поэтому
/// проверка нас пропускает. Специально НЕ добавляйте этот заголовок: с ним
/// нативный клиент начнёт получать 403.
library;

import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'api_failure.dart';
import 'session_store.dart';

class ApiClient {
  ApiClient({ApiConfig? config, SessionStore? session, http.Client? client})
    : config = config ?? const ApiConfig(),
      session = session ?? SessionStore(),
      // Клиент инжектится ради тестов: в них подаётся «подстава», которая
      // отвечает заготовленным JSON, не трогая сеть.
      _client = client ?? http.Client();

  final ApiConfig config;
  final SessionStore session;
  final http.Client _client;

  /// GET /api/...
  Future<dynamic> get(String path, {Map<String, String>? query}) =>
      _send('GET', path, query: query);

  /// POST /api/... (тело не обязательно: /register принимает и пустой запрос)
  Future<dynamic> post(String path, {Map<String, dynamic>? body}) =>
      _send('POST', path, body: body);

  Future<dynamic> put(String path, {Map<String, dynamic>? body}) =>
      _send('PUT', path, body: body);

  Future<dynamic> patch(String path, {Map<String, dynamic>? body}) =>
      _send('PATCH', path, body: body);

  Future<dynamic> delete(String path) => _send('DELETE', path);

  /// Общий путь всех запросов. Возвращает разобранный JSON: Map или List.
  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? query,
  }) async {
    final uri = Uri.parse('${config.baseUrl}$path');
    final request =
        http.Request(
            method,
            // Пустые значения не отправляем: сервер фильтрует по `($1='' OR ...)`,
            // и лишний параметр лишь затемняет лог запроса в логах.
            query == null || query.isEmpty
                ? uri
                : uri.replace(
                    queryParameters: Map.of(query)
                      ..removeWhere((_, v) => v.isEmpty),
                  ),
          )
          ..headers.addAll({
            'accept': 'application/json',
            // Сервер проверяет этот заголовок и отвечает 400 на любой другой тип.
            if (body != null) 'content-type': 'application/json',
            ...session.headers,
          });

    if (body != null) {
      request.body = jsonEncode(body);
    }

    final http.Response response;
    try {
      // `.timeout` обязателен: без него «зависший» сокет оставит пользователя
      // перед бесконечной крутилкой.
      response = await http.Response.fromStream(
        await _client.send(request).timeout(config.timeout),
      );
    } on TimeoutException {
      throw const ApiFailure(
        'Сервер не отвечает. Проверьте, что бэкенд запущен.',
        statusCode: 0,
      );
    } on http.ClientException catch (e) {
      // Сюда попадает «адрес недоступен», сброс соединения, DNS-ошибка.
      throw ApiFailure(
        'Соединение с сервером не установлено: $e',
        statusCode: 0,
      );
    }

    _captureSession(response);

    if (response.statusCode >= 400) {
      if (response.statusCode == 401) {
        // Сессия умерла на стороне сервера — перестаём её подставлять,
        // иначе каждый следующий запрос снова вернёт 401.
        session.clear();
      }
      throw ApiFailure(
        _errorMessage(response),
        statusCode: response.statusCode,
      );
    }

    if (response.body.trim().isEmpty) return const <String, dynamic>{};
    try {
      return jsonDecode(response.body);
    } on FormatException {
      // Ответ 200, но не JSON: обычно значит, что мы попали не в API,
      // а в статику фронтенда (неверный порт или адрес).
      throw const ApiFailure(
        'Сервер вернул не JSON. Проверьте API_BASE_URL.',
        statusCode: 0,
      );
    }
  }

  /// Достаём токен из `Set-Cookie`. Делает это ЛЮБОЙ успешный ответ, потому что
  /// сервер обновляет cookie в login/register, а чистит в logout (значение
  /// пустое + Max-Age=-1).
  void _captureSession(http.Response response) {
    final raw = response.headers['set-cookie'];
    if (raw == null) return;
    final token = _readCookieValue(raw);
    if (token == null) return;
    token.isEmpty ? session.clear() : session.use(token);
  }

  /// Разбор `Set-Cookie` без регулярных выражений и зависимостей.
  ///
  /// package:http склеивает повторяющиеся заголовки через запятую, а значение
  /// cookie идёт первым в паре `имя=значение`, поэтому режем по ',' и по ';'.
  /// Ограничение: атрибут `Expires=Wed, 21 Oct ...` содержит запятую и мог бы
  /// сломать разбор — наш сервер использует `Max-Age`, а не `Expires`.
  static String? _readCookieValue(String setCookieHeader) {
    for (final chunk in setCookieHeader.split(',')) {
      final pair = chunk.split(';').first.trim();
      final separator = pair.indexOf('=');
      if (separator <= 0) continue;
      if (pair.substring(0, separator).trim() != SessionStore.cookieName) {
        continue;
      }
      return pair.substring(separator + 1).trim();
    }
    return null;
  }

  /// Сообщение об ошибке: сервер всегда отвечает `{"error": "текст на русском"}`.
  static String _errorMessage(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map && decoded['error'] is String) {
        final message = (decoded['error'] as String).trim();
        if (message.isNotEmpty) return message;
      }
    } on FormatException {
      // Тело не JSON (5xx от прокси, например) — уходим в запасной текст.
    }
    return 'Сервер ответил ошибкой (${response.statusCode})';
  }
}
