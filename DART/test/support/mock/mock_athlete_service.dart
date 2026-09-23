/// Реализация контракта `AthleteService` на mock-базе.
///
/// Всё делает `MockDatabase`: рейтинг там считается тем же кодом, что и на
/// сервере (`entities/rating`), поэтому цифры демо и продакшена совпадают.
library;

import 'package:fps_app/entities/athlete/athlete.dart';

import 'mock_database.dart';
import 'mock_transport.dart';

class MockAthleteService implements AthleteService {
  MockAthleteService([MockDatabase? db]) : _db = db ?? MockDatabase.instance;

  final MockDatabase _db;

  /// GET /api/me
  @override
  Future<CurrentSession> me() => mockCall(_db.me);

  /// GET /api/athletes/{id}
  @override
  Future<Athlete> getById(String athleteId) =>
      mockCall(() => _db.athleteById(athleteId));

  /// GET /api/rankings
  @override
  Future<RankingPage> rankings() => mockCall(
    () => RankingPage(athletes: _db.rankedAthletes(), asOf: DateTime.now()),
  );

  /// PATCH /api/me
  @override
  Future<CurrentSession> updateProfile(AthleteProfileUpdate update) =>
      mockCall(() => _db.updateProfile(update));

  /// PATCH /api/athletes/{id}/rank
  @override
  Future<Athlete> setRank(String athleteId, AthleteRank? rank) =>
      mockCall(() => _db.setRank(athleteId, rank));
}
