/// BARREL-ФАЙЛ слайса `entities/athlete` — единственная дверь наружу.
///
/// Зачем он нужен в FSD: остальные слои (features, pages) не лазают по
/// внутренним папкам `model/`, а импортируют сущность из ОДНОГО места:
///
///   import '../../entities/athlete/athlete.dart';            // ✅ правильно
///   import '../../entities/athlete/model/athlete.dart';      // ❌ лезем вовнутрь
///
/// Что это даёт на практике:
/// 1) Свобода внутри слайса. Сегодня модель в одном файле, завтра их пять —
///    ни один импорт сверху не изменится, поправим только export здесь.
/// 2) Меньше импортов в коде страниц: вместо трёх строк — одна.
/// 3) «Белый список» публичного API: что не экспортировано, то остаётся
///    внутренним делом слайса и наружу не светится.
library;

// Публичный API: модель спортсмена, справочник разрядов и контракты
// авторизации/анкеты. Дисциплин здесь нет сознательно: они переехали в
// отдельный слайс `entities/discipline`, потому что пришли из таблицы, а не
// из enum-а клиента.
export 'model/athlete.dart';
export 'model/athlete_profile_update.dart';
export 'model/athlete_rank.dart' show AthleteRank;
export 'model/athlete_service.dart';
export 'model/auth_service.dart';
export 'model/auth_user.dart';
export 'model/athlete_http_service.dart';
export 'model/auth_http_service.dart';
export 'model/current_session.dart';
export 'model/ranking_page.dart';
