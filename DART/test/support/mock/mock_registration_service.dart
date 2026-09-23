/// Реализация контракта `RegistrationService` на mock-базе.
///
/// Заявка в mock-базе, как и на сервере, — просто строка связи
/// «соревнование ↔ спортсмен»: статуса и подтверждения нет, поэтому и методов
/// ровно три.
library;

import 'package:fps_app/entities/competition/competition.dart';
import 'package:fps_app/entities/registration/registration.dart';

import 'mock_database.dart';
import 'mock_transport.dart';

class MockRegistrationService implements RegistrationService {
  MockRegistrationService([MockDatabase? db])
    : _db = db ?? MockDatabase.instance;

  final MockDatabase _db;

  /// GET /api/me/registrations
  @override
  Future<List<Competition>> mine() => mockCall(_db.myRegistrations);

  /// POST /api/competitions/{id}/register
  @override
  Future<void> register(String competitionId) =>
      mockCall(() => _db.joinCompetition(competitionId));

  /// DELETE /api/competitions/{id}/register
  @override
  Future<void> cancel(String competitionId) =>
      mockCall(() => _db.cancel(competitionId));
}
