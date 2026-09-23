/// Строка итогового протокола (`competitions.Result` на сервере).
///
/// П.3 ТЗ: «результат жёстко связан: Спортсмен → Соревнование → Дисциплина →
/// Место/Результат». Связь держит сервер: строка протокола не может существовать
/// без соревнования, а участвовать может либо спортсмен (`athlete_id`), либо
/// команда (`team_id`) — в БД это CHECK «не то и другое сразу».
///
/// Дисциплина и уровень здесь НЕ дублируются: они у самого соревнования,
/// а рейтинговые очки считаются сервером и видны в `AthleteResult`.
library;

import '../../../shared/utils/text_bytes.dart';
import 'competition_enums.dart' show CompetitionFormat;

class ProtocolEntry {
  const ProtocolEntry({
    this.id = '',
    this.athleteId = '',
    this.teamId = '',
    required this.place,
    this.scoreText = '',
    this.name = '',
  });

  /// id строки в БД. Пусто — для ещё не опубликованной записи.
  final String id;

  /// Для личного зачёта. Пусто, если это командная строка.
  final String athleteId;

  /// Для командного зачёта. Пусто, если это личная строка.
  final String teamId;

  /// Официальное место. Сервер требует: 1 ≤ place ≤ числа строк в протоколе.
  final int place;

  /// «6 из 10 задач», «245 баллов» — как скажет организатор. До 200 символов.
  final String scoreText;

  /// ФИО спортсмена или название команды: сервер подмешивает его в ответ,
  /// чтобы протокол читался человеком без дополнительных запросов.
  final String name;

  bool get isTeam => teamId.isNotEmpty;

  /// Кому принадлежит строка (для списков и выборров).
  String get entrantId => isTeam ? teamId : athleteId;

  factory ProtocolEntry.fromJson(Map<String, dynamic> json) => ProtocolEntry(
    id: '${json['id'] ?? ''}',
    athleteId: '${json['athlete_id'] ?? ''}',
    teamId: '${json['team_id'] ?? ''}',
    place: json['place'] is num ? (json['place'] as num).toInt() : 0,
    scoreText: json['score_text'] as String? ?? '',
    name: json['name'] as String? ?? '',
  );

  /// Тело ДЛЯ ПУБЛИКАЦИИ: только athlete_id | team_id, place, score_text.
  /// `id` и `name` сервер хотя и знает, но вычисляет сам (ФИО берёт из таблицы,
  /// id — из строки БД), поэтому просим его не трогать: меньше шансов разойтись
  /// с тем, что реально хранится.
  Map<String, dynamic> toPublishJson() => {
    if (isTeam)
      'team_id': int.tryParse(teamId)
    else
      'athlete_id': int.tryParse(athleteId),
    'place': place,
    'score_text': scoreText.trim(),
  };

  ProtocolEntry copyWith({int? place, String? scoreText}) => ProtocolEntry(
    id: id,
    athleteId: athleteId,
    teamId: teamId,
    place: place ?? this.place,
    scoreText: scoreText ?? this.scoreText,
    name: name,
  );

  @override
  String toString() => '$place. $name ($scoreText)';
}

/// Проверка всего протокола — по правилам `validateProtocol`
/// (backend/internal/competitions/service.go). Возвращает текст ошибки или null.
///
/// Держим это здесь, а не в фиче: правила относятся к форме протокола, и их
/// должны видеть и админка, и тесты. Сервер всё равно перепроверит (500/400 без
/// него невозможны), но показывать организатору «место вне диапазона» дешевле
/// до отправки запроса.
/// [format] обязателен, потому что сервер проверяет протокол ВМЕСТЕ с форматом
/// турнира: в личном зачёте у строки не должно быть `team_id`, в командном —
/// `athlete_id`. Без формата эта проверка пропустила бы обратно неверный вид
/// участника, и сервер ответил бы 400 с бессмысленным «Проверьте данные…».
String? protocolError(
  List<ProtocolEntry> protocol, {
  required CompetitionFormat format,
}) {
  final team = format == CompetitionFormat.team;
  if (protocol.isEmpty) return 'Протокол пуст: добавьте хотя бы одну строку';
  final seen = <String>{};
  for (final entry in protocol) {
    final entrant = entry.entrantId;
    final who = entry.name.isEmpty ? entrant : entry.name;
    if (entrant.isEmpty) return 'У строки протокола нет участника';
    if (entry.isTeam != team) {
      return team
          ? 'В командном зачёте место даётся КОМАНДЕ, а не спортсмену'
          : 'В личном зачёте место даётся СПОРТСМЕНУ, а не команде';
    }
    if (!seen.add(entrant)) {
      return '$who встречается в протоколе дважды';
    }
    if (entry.place < 1 || entry.place > protocol.length) {
      return 'Место для «$who» — от 1 до ${protocol.length}';
    }
    // Границу в 200 байт сервер мерит по строке КАК ЕЁ ПРИСЛАЛИ (Go `len()`,
    // без обрезки пробелов), и мы отправляем `score_text` тоже без обрезки —
    // иначе проверка расходилась бы с телом запроса.
    if (utf8Length(entry.scoreText) > 200) {
      return utf8LimitHint('Результат для «$who»', 200);
    }
  }
  return null;
}
