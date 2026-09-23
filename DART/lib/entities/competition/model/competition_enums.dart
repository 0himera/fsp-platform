/// Справочники соревнований: уровень, формат, статус и этап.
///
/// Ключи `jsonKey` — ДОСЛОВНЫЕ значения из CHECK-ограничений БД:
///   level_code IN ('rf_championship','all_russian','interregional',
///                  'rd_championship','regional')            -- 001_initial.sql
///   format     IN ('individual','team')
///   status     IN ('draft','open','running','completed')
/// Это контракт: своя орфография здесь = 400 от сервера.
///
/// Числа формулы рейтинга (база очков уровня, бонус разряда) намеренно НЕ тут —
/// они в `entities/rating/model/rating_calculator.dart`.
library;

/// Уровень соревнования — главный «множитель» очков (120 … 1000).
enum CompetitionLevel {
  regional('regional', 'Региональное', 1),
  rdChampionship('rd_championship', 'Чемпионат/Кубок Дагестана', 2),
  interregional('interregional', 'Межрегиональное', 3),
  allRussian('all_russian', 'Всероссийские старты', 4),
  rfChampionship('rf_championship', 'Чемпионат/Кубок России', 5);

  const CompetitionLevel(this.jsonKey, this.label, this.order);

  /// Код в JSON сервера.
  final String jsonKey;

  /// Подпись в карточке и в фильтре.
  final String label;

  /// Ступень силы (1..5) — для сортировки «сильные сначала».
  final int order;

  static CompetitionLevel? fromJsonKey(String? raw) {
    if (raw == null) return null;
    for (final level in values) {
      if (level.jsonKey == raw) return level;
    }
    return null;
  }
}

/// Формат зачёта. В сервере ровно два значения: личный и командный.
/// (Парного нет — попытки создать турнир `format: "pair"` дают 400.)
enum CompetitionFormat {
  individual('individual', 'Личный'),
  team('team', 'Командный');

  const CompetitionFormat(this.jsonKey, this.label);

  final String jsonKey;
  final String label;

  static CompetitionFormat? fromJsonKey(String? raw) {
    if (raw == null) return null;
    for (final format in values) {
      if (format.jsonKey == raw) return format;
    }
    return null;
  }
}

/// Статус соревнования.
///
/// РАНЬШЕ мы его ВЫЧИСЛЯЛИ из дат; теперь он хранится на сервере и приходит
/// строкой, потому что у статуса есть смысл, которого в датах нет:
///  • `draft` — черновик организатора, спортсмены его не видят вообще;
///  • `completed` — протокол опубликован, и это факт, а не дата в календаре.
/// Поэтому клиент верит серверу, а даты использует только для двух
/// подсказок: «идёт регистрация» и «начнётся/идёт/завершится».
enum CompetitionStatus {
  draft('draft', 'черновик'),
  open('open', 'идёт регистрация'),
  running('running', 'идёт'),
  completed('completed', 'завершено');

  const CompetitionStatus(this.jsonKey, this.label);

  final String jsonKey;

  /// Короткая человеческая подпись для бейджа на карточке.
  final String label;

  static CompetitionStatus fromJsonKey(String? raw) {
    for (final status in values) {
      if (status.jsonKey == raw) return status;
    }
    // Неизвестное значение считаем завершённым: такой турнир нельзя
    // «зарегистрировать», то есть это безопасная сторона ошибки.
    return CompetitionStatus.completed;
  }
}
