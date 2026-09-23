/// Данные соревнования В ФОРМЕ ЗАПРОСА (то, что отправляем на сервер).
///
/// ПОЧЕМУ ОТДЕЛЬНО ОТ `Competition`: сервер раскодирует тело строго —
/// `decoder.DisallowUnknownFields()` (backend/internal/httpapi/server.go).
/// Лишнее поле (`id`, `registrations_count`, ...) означает 400 «unknown field»,
/// поэтому read-модель и write-модель не могут быть одним объектом с одним
/// `toJson`. Это не дублирование ради красы, а защита от целого класса багов.
library;

import '../../../shared/utils/text_bytes.dart';
import 'competition.dart';
import 'competition_enums.dart';

class CompetitionDraft {
  const CompetitionDraft({
    required this.title,
    required this.level,
    required this.disciplineCode,
    required this.format,
    required this.startsAt,
    required this.endsAt,
    required this.registrationDeadline,
    required this.status,
    this.stage = CompetitionStage.standalone,
    this.qualifyingCompetitionId,
    this.qualifyingPlaceLimit,
    this.location = '',
    this.description = '',
  });

  /// Собирает черновик из уже существующего турнира — форма редактирования
  /// стартует с текущими значениями, а не с пустых полей.
  factory CompetitionDraft.from(Competition c) => CompetitionDraft(
    title: c.title,
    level: c.level,
    disciplineCode: c.disciplineCode,
    format: c.format,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    registrationDeadline: c.registrationDeadline,
    // Статус «завершено» сервер в этом списке не принимает, поэтому для
    // опубликованного турнира ставим `running`: изменить его всё равно нельзя,
    // а форма не должна предлагать заведомо неверный вариант.
    status: c.status == CompetitionStatus.completed
        ? CompetitionStatus.running
        : c.status,
    stage: c.stage,
    qualifyingCompetitionId: c.qualifyingCompetitionId,
    qualifyingPlaceLimit: c.qualifyingPlaceLimit,
    location: c.location,
    description: c.description,
  );

  final String title;
  final CompetitionLevel level;
  final String disciplineCode;
  final CompetitionFormat format;
  final DateTime startsAt;
  final DateTime endsAt;
  final DateTime registrationDeadline;

  /// Статус: сервер допускает `draft | open | running`. `completed` выставляется
  /// ТОЛЬКО публикацией протокола, поэтому в форме его быть не должно.
  final CompetitionStatus status;

  final CompetitionStage stage;
  final String? qualifyingCompetitionId;
  final int? qualifyingPlaceLimit;
  final String location;
  final String description;

  /// Копия с заменой отдельных полей. Черновик неизменяемый (его показывает
  /// форма и сверяет валидация), а организатор меняет поле за полем — поэтому
  /// каждое изменение собирает новый объект, а не правит существующий.
  ///
  /// `null` в аргументе означает «оставить как было», а не «очистить»: чистка
  /// полей связки нужна только при смене этапа и вынесена в [copyWithStage].
  CompetitionDraft copyWith({
    String? title,
    CompetitionLevel? level,
    String? disciplineCode,
    CompetitionFormat? format,
    DateTime? startsAt,
    DateTime? endsAt,
    DateTime? registrationDeadline,
    CompetitionStatus? status,
    CompetitionStage? stage,
    String? qualifyingCompetitionId,
    int? qualifyingPlaceLimit,
    String? location,
    String? description,
  }) => CompetitionDraft(
    title: title ?? this.title,
    level: level ?? this.level,
    disciplineCode: disciplineCode ?? this.disciplineCode,
    format: format ?? this.format,
    startsAt: startsAt ?? this.startsAt,
    endsAt: endsAt ?? this.endsAt,
    registrationDeadline: registrationDeadline ?? this.registrationDeadline,
    status: status ?? this.status,
    stage: stage ?? this.stage,
    qualifyingCompetitionId:
        qualifyingCompetitionId ?? this.qualifyingCompetitionId,
    qualifyingPlaceLimit: qualifyingPlaceLimit ?? this.qualifyingPlaceLimit,
    location: location ?? this.location,
    description: description ?? this.description,
  );

  /// Смена этапа. Отдельный метод, а не `copyWith(stage: ...)`: сервер требует
  /// строгое соответствие `(stage == 'final') ==
  /// (qualifying_competition_id != null)`, поэтому у не-финала оба поля связки
  /// обязаны стать null — сброс нельзя отдавать на откуп вызывающему коду.
  CompetitionDraft copyWithStage(CompetitionStage stage) {
    if (stage == CompetitionStage.finalStage) return copyWith(stage: stage);
    return CompetitionDraft(
      title: title,
      level: level,
      disciplineCode: disciplineCode,
      format: format,
      startsAt: startsAt,
      endsAt: endsAt,
      registrationDeadline: registrationDeadline,
      status: status,
      stage: stage,
      location: location,
      description: description,
    );
  }

  /// Дата в запросе — ТОЛЬКО с отметкой зоны.
  ///
  /// `toIso8601String()` у локального времени зону не дописывает
  /// (`2026-10-23T13:16:28.717461`), а Go раскодирует поле по RFC 3339 и на
  /// строке без `Z`/смещения отвечает 400 («cannot parse "" as "Z07:00"»).
  /// Даты форма берёт локальными (календарь, `DateTime.now()`), поэтому гоняем
  /// через `toUtc()`: момент не меняется, а сервер его понимает.
  static String _stamp(DateTime value) => value.toUtc().toIso8601String();

  /// Ровно те ключи, которые ждёт `competitions.Input`. Ничего лишнего.
  Map<String, dynamic> toJson() => {
    'title': title.trim(),
    'level_code': level.jsonKey,
    'discipline_code': disciplineCode,
    'format': format.jsonKey,
    'starts_at': _stamp(startsAt),
    'ends_at': _stamp(endsAt),
    'registration_deadline': _stamp(registrationDeadline),
    'location': location.trim(),
    'description': description.trim(),
    'status': status.jsonKey,
    'stage': stage.jsonKey,
    // Для не-финала обязательны null — иначе сервер не пропустит (проверка
    // `(stage == 'final') == (qualifying_competition_id != null)`).
    'qualifying_competition_id': stage == CompetitionStage.finalStage
        ? int.tryParse(qualifyingCompetitionId ?? '')
        : null,
    'qualifying_place_limit': stage == CompetitionStage.finalStage
        ? qualifyingPlaceLimit
        : null,
  };

  /// Локальная проверка по тем же правилам, что в `validInput` сервера
  /// (internal/competitions/service.go). Возвращает текст для подсказки в форме
  /// или null, если всё в порядке.
  ///
  /// Зачем дублировать валидацию клиента: чтобы организатор увидел «нужно не
  /// больше 160 байт» сразу в поле, а не после кругового запроса к API.
  ///
  /// Название меряется ИМЕННО в байтах UTF-8 и именно по `toJson()`: сервер
  /// сравнивает `len(strings.TrimSpace(title)) >= 3` и `len(title) <= 160`, а
  /// мы отправляем обрезанное значение. Считать символы — значит расходиться с
  /// бэкендом: «аб» для формы было бы слишком коротко, хотя сервер принимает
  /// эти 4 байта, а 100 русских букв форма пропустила бы, хотя сервер их
  /// отклоняет.
  String? get validationError {
    final name = title.trim();
    if (utf8Length(name) < 3) return 'Название — не короче 3 байт';
    if (utf8Length(name) > 160) return utf8LimitHint('Название', 160);
    if (disciplineCode.isEmpty) return 'Выберите дисциплину';
    if (status == CompetitionStatus.completed) {
      return 'Статус «завершено» ставит сервер после публикации протокола';
    }
    if (endsAt.isBefore(startsAt)) {
      return 'Окончание не может быть раньше начала';
    }
    if (registrationDeadline.isAfter(endsAt)) {
      return 'Срок подачи заявок не может быть позже окончания';
    }
    if (stage == CompetitionStage.finalStage) {
      final limit = qualifyingPlaceLimit ?? 0;
      if (qualifyingCompetitionId == null) {
        return 'Финалу нужен отборочный турнир';
      }
      if (limit < 1 || limit > 10000) {
        return 'Проходное место — от 1 до 10000';
      }
    }
    return null;
  }
}
