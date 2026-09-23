/// Модель соревнования (турнира) Федерации — п.2 ТЗ в том виде, как её отдаёт
/// бэкенд (`internal/competitions.Competition`).
///
/// Слой `entities`: данные и выводы ИЗ данных, без обращений к сети.
library;

import 'competition_enums.dart';

/// Один турнир: карточка, фильтр, регистрация, протокол — всё про него.
class Competition {
  const Competition({
    required this.id,
    required this.title,
    required this.level,
    required this.disciplineCode,
    required this.format,
    required this.startsAt,
    required this.endsAt,
    required this.registrationDeadline,
    required this.status,
    required this.stage,
    this.qualifyingCompetitionId,
    this.qualifyingPlaceLimit,
    this.location = '',
    this.description = '',
    this.registrationsCount = 0,
    this.resultsCount = 0,
  });

  /// id турнира в базе сервера. Хранится строкой: сервер отдаёт int64, а для
  /// клиента важнее возможность положить id в ключ Map и в путь URL без
  /// раздумий «число это или строка». Обратное преобразование — только в URL.
  final String id;

  final String title;

  /// Уровень: от него зависит база очков (120 … 1000).
  final CompetitionLevel level;

  /// Код дисциплины. НЕ enum: справочник дисциплин живёт в таблице `disciplines`
  /// и организатор может добавить новую через POST /api/disciplines.
  final String disciplineCode;

  /// Личный или командный зачёт.
  final CompetitionFormat format;

  final DateTime startsAt;
  final DateTime endsAt;

  /// ЕДИНСТВЕННАЯ дата регистрации: «когда регистрация ОТКРЫВАЕТСЯ» сервером
  /// не моделируется — турнир открыт, пока статус `open` и срок не истёк.
  final DateTime registrationDeadline;

  final String location;
  final String description;

  /// Статус пришёл от сервера (см. комментарий в competition_enums.dart).
  final CompetitionStatus status;

  /// Этап: самостоятельный / отбор / финал.
  final CompetitionStage stage;

  /// Для финала: id отборочного турнира, результат в котором открывает заявку.
  final String? qualifyingCompetitionId;

  /// Для финала: проходное место (попадание в топ-N отбора).
  final int? qualifyingPlaceLimit;

  /// Счётчики прилетают в списке, чтобы карточка могла показать
  /// «12 заявок» без отдельного запроса.
  final int registrationsCount;
  final int resultsCount;

  /// Турнир командный? У UI от этого зависит: показывать составы или ФИО.
  bool get isTeam => format == CompetitionFormat.team;

  /// Финал, доступ к которому закрыт непрошедшим отбор.
  bool get isGatedFinal => stage == CompetitionStage.finalStage;

  /// Можно ли подать заявку СЕЙЧАС. Сервер проверит то же самое и вернёт 409,
  /// но мы не ведём пользователя к заведомой ошибке и прячем кнопку.
  bool isRegistrationOpen(DateTime now) =>
      status == CompetitionStatus.open && now.isBefore(registrationDeadline);

  /// Организатор может опубликовать протокол не раньше старта (сервер:
  /// `if startsAt.After(now) -> ErrClosed`).
  ///
  /// Статус «завершено» тут СОЗНАТЕЛЬНО не мешает: публикация ставит
  /// `status='completed'` (backend/internal/competitions/service.go), но
  /// `PublishResults` завершённый турнир не отклоняет — протокол заменяется
  /// целиком, а старая версия уходит в `result_publications`. Запретил бы мы
  /// его, организатор никогда не исправил бы опечатку в уже опубликованном
  /// составе. Единственное, что мы предсказать не можем, — закрытый отбор
  /// (у его финала уже есть заявки): сервер ответит 409, и текст ошибки покажет UI.
  bool canPublishResults(DateTime now) => !startsAt.isAfter(now);

  factory Competition.fromJson(Map<String, dynamic> json) {
    return Competition(
      id: '${json['id'] ?? ''}',
      title: json['title'] as String? ?? 'Без названия',
      level:
          CompetitionLevel.fromJsonKey(json['level_code'] as String?) ??
          CompetitionLevel.regional,
      disciplineCode: json['discipline_code'] as String? ?? '',
      format:
          CompetitionFormat.fromJsonKey(json['format'] as String?) ??
          CompetitionFormat.individual,
      startsAt: _date(json['starts_at']),
      endsAt: _date(json['ends_at']),
      registrationDeadline: _date(json['registration_deadline']),
      location: json['location'] as String? ?? '',
      description: json['description'] as String? ?? '',
      status: CompetitionStatus.fromJsonKey(json['status'] as String?),
      stage: CompetitionStage.fromJsonKey(json['stage'] as String?),
      qualifyingCompetitionId: _idOrNull(json['qualifying_competition_id']),
      qualifyingPlaceLimit: json['qualifying_place_limit'] is num
          ? (json['qualifying_place_limit'] as num).toInt()
          : null,
      registrationsCount: _count(json['registrations_count']),
      resultsCount: _count(json['results_count']),
    );
  }

  /// Только для чтения/отладки. ВАЖНО: этот набор ключей НЕ подходит для
  /// записи — сервер принимает строгий `CompetitionDraft` и отклоняет
  /// неизвестные поля (DisallowUnknownFields), поэтому `toJson` тут не используется
  /// в POST/PUT.
  Map<String, dynamic> toJson() => {
    'id': int.tryParse(id) ?? id,
    'title': title,
    'level_code': level.jsonKey,
    'discipline_code': disciplineCode,
    'format': format.jsonKey,
    'starts_at': startsAt.toIso8601String(),
    'ends_at': endsAt.toIso8601String(),
    'registration_deadline': registrationDeadline.toIso8601String(),
    'location': location,
    'description': description,
    'status': status.jsonKey,
    'stage': stage.jsonKey,
    'qualifying_competition_id': qualifyingCompetitionId == null
        ? null
        : int.tryParse(qualifyingCompetitionId!),
    'qualifying_place_limit': qualifyingPlaceLimit,
    'registrations_count': registrationsCount,
    'results_count': resultsCount,
  };

  /// Дата из JSON с безопасным откатом.
  ///
  /// DateTime.tryParse даёт null на кривой строке. Откат в 1970 год: турнир с
  /// такой датой сразу бросается в глаза в списке, вместо тихого падения экрана.
  static DateTime _date(Object? raw) =>
      DateTime.tryParse(raw?.toString() ?? '') ?? DateTime(1970);

  static String? _idOrNull(Object? raw) {
    if (raw == null) return null;
    final id = '$raw';
    return id.isEmpty || id == 'null' ? null : id;
  }

  static int _count(Object? raw) => raw is num ? raw.toInt() : 0;

  /// Копия с другими счётчиками. Нужна не интерфейсу, а тестовой подмене из
  /// `test/support/mock/`: заявок и строк протокола у турнира ровно столько,
  /// сколько записей, поэтому счётчики там пересчитываются при каждом
  /// изменении. Сервер делает то же самое подзапросами `count(*)` в
  /// `selectCompetition`.
  Competition copyWithCounters({int? registrationsCount, int? resultsCount}) =>
      Competition(
        id: id,
        title: title,
        level: level,
        disciplineCode: disciplineCode,
        format: format,
        startsAt: startsAt,
        endsAt: endsAt,
        registrationDeadline: registrationDeadline,
        status: status,
        stage: stage,
        qualifyingCompetitionId: qualifyingCompetitionId,
        qualifyingPlaceLimit: qualifyingPlaceLimit,
        location: location,
        description: description,
        registrationsCount: registrationsCount ?? this.registrationsCount,
        resultsCount: resultsCount ?? this.resultsCount,
      );

  @override
  String toString() => '$title (${level.label}, ${status.label})';
}

/// Этап соревнования — перевод кода `stage` из таблицы competitions.
///
/// Держим свой тип (а не строку), потому что ветвление «финал или нет»
/// разбросано по карточке, фильтрам и проверке допуска.
enum CompetitionStage {
  standalone('standalone', 'самостоятельное'),
  qualification('qualification', 'отбор'),
  finalStage('final', 'финал');

  const CompetitionStage(this.jsonKey, this.label);

  final String jsonKey;
  final String label;

  static CompetitionStage fromJsonKey(String? raw) {
    for (final stage in values) {
      if (stage.jsonKey == raw) return stage;
    }
    return CompetitionStage.standalone;
  }
}
