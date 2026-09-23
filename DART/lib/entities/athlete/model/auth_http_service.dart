/// Реализация контракта `AuthService` поверх реального бэкенда
/// (backend/internal/httpapi/auth.go).
///
/// Про сессии здесь ни строчки: `ApiClient` сам забирает `Set-Cookie:
/// arena_session` из ответа и сам подставляет её в следующие запросы. Разошлась
/// бы эта логика по UI — работа с cookie «протекла» бы в каждый экран.
library;

import '../../../shared/api/api.dart';
import 'auth_service.dart';
import 'auth_user.dart';

class AuthHttpService implements AuthService {
  AuthHttpService(this._api);

  final ApiClient _api;

  @override
  Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.post(
      '/api/auth/login',
      // Ключи ровно как в `struct { Email, Password }` сервера: лишнее поле
      // означает 400 (decodeJSON + DisallowUnknownFields).
      body: {'email': email.trim(), 'password': password},
    );
    return _userOf(response);
  }

  @override
  Future<AuthUser> register({
    required String email,
    required String password,
    required String fullName,
    String organization = '',
    String city = '',
  }) async {
    final response = await _api.post(
      '/api/auth/register',
      body: {
        'email': email.trim(),
        'password': password,
        'full_name': fullName.trim(),
        'organization': organization.trim(),
        'city': city.trim(),
      },
    );
    return _userOf(response);
  }

  @override
  Future<void> logout() async {
    // Ответ сервера (`{"ok": true}` + очищенная cookie) нам не нужен: клиент
    // уже перестанет подставлять сессию, а 401 на следующих запросах — норма.
    await _api.post('/api/auth/logout');
  }

  /// И логин, и регистрация отвечают одним: `{"user": {...}}`.
  static AuthUser _userOf(dynamic response) =>
      AuthUser.fromJson(asJsonObject(asJsonObject(response)['user']));
}
