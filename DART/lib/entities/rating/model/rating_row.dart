/// Исходная строка для расчёта рейтинга: «факт выступления» без очков.
///
/// Это ровно те колонки, которые сервер достаёт из БД перед тем как считать
/// (`internal/rating/rating.go`, запрос `All`: id соревнования, название,
/// дисциплина, уровень, этап, дата окончания, место и число финишировавших).
/// То есть [RatingRow] — вход формулы, а `AthleteResult` — её выход с уже
/// разложенными коэффициентами.
library;

import '../../competition/competition.dart';

class RatingRow {
  const RatingRow({
    required this.competitionId,
    required this.competitionTitle,
    required this.disciplineCode,
    required this.level,
    required this.stage,
    required this.endsAt,
    required this.place,
    required this.finishers,
  });

  /// Строка из опубликованного протокола.
  ///
  /// `finishers` передаётся отдельно и это ВАЖНО: для командного зачёта N —
  /// это ЧИСЛО КОМАНД, а не сумма их участников (README: «для командного зачёта
  /// N считается по командам; каждый спортсмен получает одинаковое количество
  /// очков»). Сервер считает `count(*)` по строкам таблицы results, и строк там
  /// по одной на команду — поэтому и тестовая подмена считает так же.
  factory RatingRow.from({
    required Competition competition,
    required ProtocolEntry entry,
    required int finishers,
  }) => RatingRow(
    competitionId: competition.id,
    competitionTitle: competition.title,
    disciplineCode: competition.disciplineCode,
    level: competition.level,
    stage: competition.stage,
    endsAt: competition.endsAt,
    place: entry.place,
    finishers: finishers,
  );

  final String competitionId;
  final String competitionTitle;
  final String disciplineCode;
  final CompetitionLevel level;
  final CompetitionStage stage;
  final DateTime endsAt;
  final int place;
  final int finishers;
}
