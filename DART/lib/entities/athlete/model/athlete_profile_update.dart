/// Правка анкеты спортсмена — тело `PATCH /api/me`.
///
/// ОТДЕЛЬНЫЙ класс, а не `Athlete.toJson()`: сервер раскодирует строго
/// (`DisallowUnknownFields`) и ждёт РОВНО четыре ключа —
/// `full_name`, `organization`, `city`, `disciplines`
/// (backend/internal/athletes/service.go: `type Update`).
/// Рейтинг, разряд и id в этом запросе быть не должно: разряд меняет
/// организатор отдельным эндпоинтом, а рейтинг считается сам.
library;

import '../../../shared/utils/text_bytes.dart';

class AthleteProfileUpdate {
  const AthleteProfileUpdate({
    required this.fullName,
    required this.organization,
    required this.city,
    required this.disciplineCodes,
  });

  final String fullName;

  /// Вуз/организация — до 160 байт в UTF-8 (проверка на сервере).
  final String organization;

  final String city;

  /// До 5 дисциплин: `if len(input.Disciplines) > 5 -> 400`.
  final List<String> disciplineCodes;

  Map<String, dynamic> toJson() => {
    'full_name': fullName.trim(),
    'organization': organization.trim(),
    'city': city.trim(),
    'disciplines': disciplineCodes,
  };

  /// Локальная подсказка по тем же границам, что проверяет сервер
  /// (`internal/httpapi/auth.go`). Все границы — в байтах UTF-8: Go измеряет
  /// длину строки через `len()`, где русская буква занимает два байта.
  /// Меряем обрезанные значения — ровно те, что уходят в `toJson()`.
  String? get validationError {
    final name = fullName.trim();
    if (utf8Length(name) < 2) return 'ФИО — не короче 2 байт';
    if (utf8Length(name) > 100) return utf8LimitHint('ФИО', 100);
    if (utf8Length(city.trim()) > 100) return utf8LimitHint('Город', 100);
    if (utf8Length(organization.trim()) > 160) {
      return utf8LimitHint('Организация', 160);
    }
    // А вот дисциплины сервер считает ШТУКАМИ (`len(input.Disciplines) > 5` —
    // это длина среза, а не строки), так что остаёмся при `.length`.
    if (disciplineCodes.length > 5) {
      return 'Можно выбрать не больше 5 дисциплин';
    }
    return null;
  }
}
