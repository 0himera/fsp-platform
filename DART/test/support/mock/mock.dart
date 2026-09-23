/// Barrel-файл тестовой подмены сервисов (`test/support/mock`).
///
/// Наружу отдаются два слоя подмены: `MockDatabase` (состояние + правила,
/// скопированные с бэкенда один в один) и пять сервисов, реализующих те же
/// контракты `entities`, что и HTTP-классы. Контроллеры и страницы выбирают
/// КОНТРАКТ и не знают, кто за ним стоит, — поэтому тесты проверяют тот же
/// код, что работает с API. В `lib/` моков больше нет: приложение говорит
/// только с бэкендом.
library;

export 'mock_app_services.dart';
export 'mock_athlete_service.dart';
export 'mock_auth_service.dart';
export 'mock_competition_service.dart';
export 'mock_database.dart';
export 'mock_discipline_service.dart';
export 'mock_registration_service.dart';
