/// Сборка `AppServices` из mock-сервисов — ТОЛЬКО для тестов.
///
/// Приложения в таком виде не существует: `main()` всегда строит HTTP-связку
/// (`AppServices.http()`), и подменить ей данные можно только там, где
/// `FpsApp` создаётся вручную, то есть в `test/`.
///
/// [db] передаётся извне именно потому, что состояние в моках ОДНО на все
/// сервисы: тесту нужна своя база, чтобы первый `test(...)` не оставил во
/// втором залогиненную сессию и не доел чужие заявки.
library;

import 'package:fps_app/main.dart';

import 'mock_athlete_service.dart';
import 'mock_auth_service.dart';
import 'mock_competition_service.dart';
import 'mock_database.dart';
import 'mock_discipline_service.dart';
import 'mock_registration_service.dart';

AppServices mockAppServices([MockDatabase? db]) {
  final database = db ?? MockDatabase.instance;
  return AppServices(
    auth: MockAuthService(database),
    athletes: MockAthleteService(database),
    competitions: MockCompetitionService(database),
    registrations: MockRegistrationService(database),
    disciplines: MockDisciplineService(database),
  );
}
