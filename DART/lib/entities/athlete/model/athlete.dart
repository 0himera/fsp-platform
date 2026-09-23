/// Профиль спортсмена — ровно то, что отдаёт `internal/rating.Athlete`
/// (эндпоинты `GET /api/me`, `GET /api/athletes/{id}`, строки `GET /api/rankings`).
///
/// ВАЖНОЕ РЕШЕНИЕ: рейтинг и история приезжают ВМЕСТЕ с анкетой. Мы не склеиваем
/// «спортсмена» и «его рейтинг» из двух запросов — сервер уже посчитал и то, и
/// другое, а клиент, пересчитывая своё, начал бы расходиться с таблицей рейтинга.
library;

import '../../athlete_result/athlete_result.dart';
import 'athlete_rank.dart';

class Athlete {
  const Athlete({
    required this.id,
    required this.fullName,
    required this.city,
    required this.organization,
    required this.rank,
    required this.disciplineCodes,
    required this.rating,
    required this.ratingPlace,
    required this.resultPoints,
    required this.rankBase,
    required this.activityFactor,
    required this.rankPoints,
    required this.results,
    required this.rulesVersion,
  });

  /// Скелет анкеты БЕЗ рейтинга: id, ФИО, город, организация, разряд,
  /// дисциплины — всё остальное нулевое.
  ///
  /// Нужна тестам и подмене из `test/support/mock/`: они держат «сырую
  /// анкету», а очки к ней прикладывает `RatingCalculator` (на сервере их
  /// считает `rating.Calculate`).
  const Athlete.profile({
    required this.id,
    required this.fullName,
    required this.city,
    required this.organization,
    required this.rank,
    required this.disciplineCodes,
  }) : rating = 0,
       ratingPlace = 0,
       resultPoints = 0,
       rankBase = 0,
       activityFactor = 0,
       rankPoints = 0,
       results = const [],
       rulesVersion = '';

  /// id учётной записи (`users.id`), он же id спортсмена.
  final String id;

  final String fullName;
  final String city;

  /// Вуз/организация. Имя поля повторяет серверный `organization`.
  final String organization;

  /// Разряд. `'none'` из API превращается в null (см. AthleteRank.fromJsonKey).
  final AthleteRank? rank;

  /// Дисциплины — коды из таблицы `disciplines`: спортсмен может вести несколько
  /// (`athlete_disciplines` — many-to-many), и список пополняется организатором
  /// через POST /api/disciplines, поэтому enum здесь невозможен.
  final List<String> disciplineCodes;

  // --- Рейтинг (считает сервер, формула arena-2) ---
  final double rating;
  final int ratingPlace;
  final double resultPoints;
  final double rankBase;
  final double activityFactor;
  final double rankPoints;

  /// История стартов с разложением очков по коэффициентам.
  final List<AthleteResult> results;

  /// Версия правил («arena-2»). Держим её в модели: если сервер поменяет
  /// формулу, интерфейс сможет честно сказать «расчёт по правилам v3».
  final String rulesVersion;

  factory Athlete.fromJson(Map<String, dynamic> json) {
    final rawResults = json['results'];
    final rawDisciplines = json['disciplines'];
    return Athlete(
      id: '${json['id'] ?? ''}',
      fullName: json['full_name'] as String? ?? '',
      city: json['city'] as String? ?? '',
      organization: json['organization'] as String? ?? '',
      rank: AthleteRank.fromJsonKey(json['rank_code'] as String?),
      disciplineCodes: rawDisciplines is List
          ? [for (final code in rawDisciplines) '$code']
          : const [],
      ratingPlace: _int(json['rating_place']),
      rating: _double(json['rating']),
      resultPoints: _double(json['result_points']),
      rankBase: _double(json['rank_base']),
      activityFactor: _double(json['activity_factor']),
      rankPoints: _double(json['rank_points']),
      results: rawResults is List
          ? [
              for (final item in rawResults)
                if (item is Map<String, dynamic>) AthleteResult.fromJson(item),
            ]
          : const [],
      rulesVersion: json['rules_version'] as String? ?? '',
    );
  }

  /// Только для отладки и логов: на запись уходит `AthleteProfileUpdate`,
  /// у которого набор ключей строго по контракту `PATCH /api/me`.
  Map<String, dynamic> toJson() => {
    'id': int.tryParse(id) ?? id,
    'full_name': fullName,
    'city': city,
    'organization': organization,
    'rank_code': AthleteRank.toJsonKey(rank),
    'disciplines': disciplineCodes,
    'rating_place': ratingPlace,
    'rating': rating,
    'result_points': resultPoints,
    'rank_base': rankBase,
    'activity_factor': activityFactor,
    'rank_points': rankPoints,
    'results': results.map((r) => r.toJson()).toList(),
    'rules_version': rulesVersion,
  };

  /// Четыре лучших результата, которые реально вошли в сумму (флаг `included`).
  List<AthleteResult> get countedResults =>
      results.where((r) => r.included).toList(growable: false);

  /// Копия с другим местом в таблице рейтинга: место определяет НЕ самого
  /// спортсмена, а сравнение со всеми остальными, поэтому оно приходит
  /// отдельно (`entities/rating` проставляет его по всей таблице).
  Athlete copyWithPlace(int place) => Athlete(
    id: id,
    fullName: fullName,
    city: city,
    organization: organization,
    rank: rank,
    disciplineCodes: disciplineCodes,
    rating: rating,
    ratingPlace: place,
    resultPoints: resultPoints,
    rankBase: rankBase,
    activityFactor: activityFactor,
    rankPoints: rankPoints,
    results: results,
    rulesVersion: rulesVersion,
  );

  static int _int(Object? raw) => raw is num ? raw.toInt() : 0;

  static double _double(Object? raw) => raw is num ? raw.toDouble() : 0;

  @override
  String toString() =>
      '$fullName ($organization, $city), рейтинг $rating, место $ratingPlace';
}
