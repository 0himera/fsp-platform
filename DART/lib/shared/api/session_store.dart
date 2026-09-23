/// Хранилище идентификатора сессии.
///
/// Бэкенд авторизует не токеном в заголовке Authorization, а cookie
/// `arena_session` (HttpOnly, SameSite=Lax, срок жизни 30 суток):
///   POST /api/auth/login -> `Set-Cookie: arena_session=<token>; HttpOnly`
///   GET  /api/me         -> `Cookie: arena_session=<token>`
///
/// HttpOnly — запрет на доступ к cookie из JavaScript браузера. Для нас это
/// НЕ запрет: у нас не браузер, и Dart может читать заголовок ответа и
/// подставлять заголовок запроса. Поэтому клиенту достаточно один раз
/// увидеть Set-Cookie и запомнить значение.
library;

class SessionStore {
  SessionStore([this._token]);

  /// Имя cookie, которое выставил сервер (см. backend/internal/httpapi/server.go).
  static const String cookieName = 'arena_session';

  String? _token;

  /// Текущий токен сессии или null, если мы не входили.
  String? get token => _token;

  bool get hasSession => _token != null && _token!.isNotEmpty;

  void use(String token) {
    final trimmed = token.trim();
    if (trimmed.isNotEmpty) _token = trimmed;
  }

  /// Выход из аккаунта или ответ 401: токен больше не подставляем.
  void clear() => _token = null;

  /// Заголовок для отправки. Пустая карта, пока сессии нет.
  Map<String, String> get headers =>
      hasSession ? {'cookie': '$cookieName=$_token'} : const {};
}
