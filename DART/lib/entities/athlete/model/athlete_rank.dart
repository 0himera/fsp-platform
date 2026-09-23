/// Справочник спортивных разрядов и званий.
///
/// Ключи перечисления СОВПАДАЮТ с кодом в БД сервера — ограничение
/// `athletes.rank_code IN ('none','III','II','I','KMS','MS','MSMK','ZMS')`
/// (backend/migrations/001_initial.sql). Расхождение здесь = 400 ошибка на
/// `PATCH /api/athletes/{id}/rank`, поэтому коды — часть контракта, а не вкус.
///
/// Порядок перечисления смысловой: от младшего к старшему ([order]).
///
/// ВАЖНО: бонус разряда в рейтинге (III 10 … ЗМС 250) живёт НЕ здесь, а в
/// `RatingCalculator` — справочник остаётся словарём, формула остаётся формулой.
enum AthleteRank {
  third('III разряд', 'III', 1),
  second('II разряд', 'II', 2),
  first('I разряд', 'I', 3),
  candidateMaster('КМС', 'KMS', 4),
  master('МС', 'MS', 5),
  masterInternational('МСМК', 'MSMK', 6),
  honoredMaster('ЗМС', 'ZMS', 7);

  const AthleteRank(this.label, this.jsonKey, this.order);

  /// Подпись в интерфейсе.
  final String label;

  /// Значение `rank_code` в JSON сервера.
  final String jsonKey;

  /// Ступень престижа (1..7) — для сортировки и сравнений.
  final int order;

  /// `rank_code` из API -> разряд.
  ///
  /// Код `'none'` означает «разряда нет» и превращается в null: в Dart
  /// «нет разряда» — это отсутствие значения, а не особое значение-заглушка.
  /// Неизвестный код тоже даёт null, а не первую попавшуюся ветку: лучше
  /// пустая строка в профиле, чем приписанный спортсмену чужой разряд.
  static AthleteRank? fromJsonKey(String? raw) {
    if (raw == null || raw == 'none') return null;
    for (final rank in values) {
      if (rank.jsonKey == raw) return rank;
    }
    return null;
  }

  /// Обратное преобразование: для отправки организатором выбираем конкретный
  /// код, а «нет разряда» кодируется как `'none'` — так ждёт сервер.
  static String toJsonKey(AthleteRank? rank) => rank?.jsonKey ?? 'none';
}
