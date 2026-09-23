/// Строка рейтинговой истории спортсмена — п.3 ТЗ в том виде, как её отдаёт
/// бэкенд (`internal/rating.Result`).
///
/// ЖЁСТКАЯ СВЯЗЬ из ТЗ «Спортсмен → Соревнование → Дисциплина → Место» живёт
/// в этих полях: athleteId известен из контекста (это профиль конкретного
/// спортсмена), дальше обязательны competition_id + discipline + level + place.
///
/// КЛЮЧЕВОЕ ОТЛИЧИЕ ОТ НАШИХ ПЕРВЫХ МОДЕЛЕЙ: очки и коэффициенты приходят с
/// СЕРВЕРА. Мы не пересчитываем «своё» — иначе цифры в кабинете и в таблице
/// рейтинга разошлись бы, и обвинить в этом было бы некого. Клиент только
/// показывает: очка = base × place_factor × size_factor × relative × decay.
library;

import '../../competition/competition.dart';

/// Один засчитанный (или не засчитанный) старт спортсмена.
class AthleteResult {
  const AthleteResult({
    required this.competitionId,
    required this.competitionTitle,
    required this.disciplineCode,
    required this.level,
    required this.stage,
    required this.endsAt,
    required this.place,
    required this.finishers,
    required this.base,
    required this.placeFactor,
    required this.sizeFactor,
    required this.relativeFactor,
    required this.decay,
    required this.points,
    required this.included,
  });

  /// id соревнования (в сервере это bigint, у нас — десятичная строка).
  final String competitionId;

  /// Название турнира: сервер присылает его сразу, чтобы клиенту не нужно
  /// было тянуть все соревнования ради одной строчки истории.
  final String competitionTitle;

  /// Код дисциплины (`algorithmic`, `uav`, ...) — словарь живёт на сервере.
  final String disciplineCode;

  /// Уровень турнира: от него зависит база очков (120 … 1000).
  final CompetitionLevel level;

  /// Этап: «отбор» очков не даёт, «финал» считается обычно. Тот же справочник,
  /// что и у карточки турнира, — код `stage` один на оба места.
  final CompetitionStage stage;

  /// Факт окончания соревнования — от этой даты считается давность.
  final DateTime endsAt;

  /// Официальное место в зачёте.
  final int place;

  /// N — сколько финишировало в ЗАЧЁТЕ (в командном зачёте это число команд).
  final int finishers;

  // --- Разложение очковой формулы (сервер отдаёт его прямо в ответе) ---
  final double base;
  final double placeFactor;
  final double sizeFactor;
  final double relativeFactor;
  final double decay;

  /// Итоговые очки за старт, округлённые сервером до двух знаков.
  final double points;

  /// Попал ли результат в «четыре лучших», то есть учтён ли он в рейтинге.
  final bool included;

  factory AthleteResult.fromJson(Map<String, dynamic> json) {
    return AthleteResult(
      competitionId: '${json['competition_id'] ?? ''}',
      competitionTitle: json['competition'] as String? ?? 'Без названия',
      disciplineCode: json['discipline'] as String? ?? '',
      level:
          CompetitionLevel.fromJsonKey(json['level'] as String?) ??
          CompetitionLevel.regional,
      stage: CompetitionStage.fromJsonKey(json['stage'] as String?),
      endsAt: _date(json['ends_at']),
      place: _int(json['place']),
      finishers: _int(json['finishers']),
      base: _double(json['base']),
      placeFactor: _double(json['place_factor']),
      sizeFactor: _double(json['size_factor']),
      relativeFactor: _double(json['relative_factor']),
      decay: _double(json['decay']),
      points: _double(json['points']),
      included: json['included'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'competition_id': int.tryParse(competitionId) ?? competitionId,
    'competition': competitionTitle,
    'discipline': disciplineCode,
    'level': level.jsonKey,
    'stage': stage.jsonKey,
    'ends_at': endsAt.toIso8601String(),
    'place': place,
    'finishers': finishers,
    'base': base,
    'place_factor': placeFactor,
    'size_factor': sizeFactor,
    'relative_factor': relativeFactor,
    'decay': decay,
    'points': points,
    'included': included,
  };

  /// Есть ли у старта рейтинговый вес. Нет — в истории показываем «не засчитано».
  bool get scores => points > 0;

  /// Копия с изменёнными очками и/или флагом «вошёл в четвёрку». Нужна расчётчику (`entities/rating`): он сначала
  /// считает коэффициенты, потом отдельно решает, вошёл ли результат в
  /// «четыре лучших» — когда видит все строки спортсмена сразу.
  AthleteResult copyWith({double? points, bool? included}) => AthleteResult(
    competitionId: competitionId,
    competitionTitle: competitionTitle,
    disciplineCode: disciplineCode,
    level: level,
    stage: stage,
    endsAt: endsAt,
    place: place,
    finishers: finishers,
    base: base,
    placeFactor: placeFactor,
    sizeFactor: sizeFactor,
    relativeFactor: relativeFactor,
    decay: decay,
    points: points ?? this.points,
    included: included ?? this.included,
  );

  /// Человекочитаемая формула строки: её прямо показывает интерфейс рейтинга.
  String get formula =>
      '${base.toStringAsFixed(0)} × ${placeFactor.toStringAsFixed(2)} × '
      '${sizeFactor.toStringAsFixed(2)} × ${relativeFactor.toStringAsFixed(2)} × '
      '${decay.toStringAsFixed(2)}';

  static DateTime _date(Object? raw) =>
      DateTime.tryParse(raw?.toString() ?? '') ?? DateTime(1970);

  /// Сервер считает float'ом, но `place` может прийти и как int, и как «1.0» —
  /// разбираем оба варианта, чтобы одна лишняя цифра не роняла весь экран.
  static int _int(Object? raw) =>
      raw is int ? raw : int.tryParse('${raw ?? 0}') ?? (_double(raw)).round();

  static double _double(Object? raw) =>
      raw is num ? raw.toDouble() : double.tryParse('${raw ?? 0}') ?? 0;

  @override
  String toString() => '$competitionTitle: $place из $finishers (+$points)';
}
