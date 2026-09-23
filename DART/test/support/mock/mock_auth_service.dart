/// Реализация контракта `AuthService` на mock-базе.
///
/// Класс намеренно «тонкий»: вызывает метод `MockDatabase` и оборачивает
/// результат в задержку. Все правила (роли, границы полей, тексты ошибок)
/// живут в базе — иначе демо и тесты расходились бы с сервером, а это и есть
/// баг.
library;

import 'package:fps_app/entities/athlete/athlete.dart';

import 'mock_database.dart';
import 'mock_transport.dart';

class MockAuthService implements AuthService {
  MockAuthService([MockDatabase? db]) : _db = db ?? MockDatabase.instance;

  final MockDatabase _db;

  /// POST /api/auth/login
  @override
  Future<AuthUser> login({required String email, required String password}) =>
      mockCall(() => _db.login(email, password));

  /// POST /api/auth/register
  @override
  Future<AuthUser> register({
    required String email,
    required String password,
    required String fullName,
    String organization = '',
    String city = '',
  }) => mockCall(
    () => _db.register(
      email: email,
      password: password,
      fullName: fullName,
      organization: organization,
      city: city,
    ),
  );

  /// POST /api/auth/logout
  @override
  Future<void> logout() => mockCall(_db.logout);
}
