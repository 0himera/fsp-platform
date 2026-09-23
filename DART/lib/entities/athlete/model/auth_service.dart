/// КОНТРАКТ авторизации (п.1 ТЗ: «регистрация и авторизация»).
///
///  • login()    -> POST /api/auth/login
///  • register() -> POST /api/auth/register
///  • logout()   -> POST /api/auth/logout
///
/// КАК ДЕРЖИТСЯ СЕССИЯ: сервер отвечает `Set-Cookie: arena_session=...`
/// (HttpOnly, срок 30 суток), а дальше узнаёт пользователя по этой cookie.
/// Заголовок `Authorization: Bearer ...` здесь не используется, и токен в ответе
/// не приходит — его место в cookie. Всю работу с этой cookie знает только
/// `shared/api`: сервисы получают готовый заголовок автоматически.
library;

import 'auth_user.dart';

abstract class AuthService {
  /// Почта и пароль. Неверная пара -> 401 «Неверная почта или пароль».
  Future<AuthUser> login({required String email, required String password});

  /// Регистрация спортсмена. Пароль — от 8 символов, иначе 400.
  /// Успех сразу означает «мы вошли»: сервер заводит сессию в том же ответе.
  Future<AuthUser> register({
    required String email,
    required String password,
    required String fullName,
    String organization = '',
    String city = '',
  });

  Future<void> logout();
}
