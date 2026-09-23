/// Дисциплина — элемент справочника Федерации (п.5 ТЗ: «управление
/// справочными данными»).
///
/// В отличие от разрядов и уровней (зафиксированы CHECK-ограничениями БД),
/// дисциплины — обычная таблица `disciplines`, которую организатор пополняет
/// через `POST /api/disciplines`. Поэтому на клиенте это ДАННЫЕ (код + название),
/// а не enum: новый enum потребовал бы перекомпиляции приложения, а новая
/// дисциплина добавляется кнопкой.
library;

import '../../../shared/utils/text_bytes.dart';

class Discipline {
  const Discipline({required this.code, required this.name});

  /// Устойчивый идентификатор: `algorithmic`, `uav`, ... Его хранят ссылки
  /// (`competitions.discipline_code`, `athlete_disciplines.discipline_code`),
  /// поэтому переименование дисциплины не ломает данные — меняется только [name].
  final String code;

  /// Показываемое название на русском.
  final String name;

  factory Discipline.fromJson(Map<String, dynamic> json) => Discipline(
    code: json['code'] as String? ?? '',
    name: json['name'] as String? ?? '',
  );

  Map<String, dynamic> toJson() => {'code': code, 'name': name};

  @override
  String toString() => name;
}

/// Код дисциплины: `^[a-z][a-z0-9_]{1,31}$` из `internal/httpapi/disciplines.go`.
///
/// Держим регулярку один-в-один: длина кода получается от 2 до 32 символов,
/// первая — строго строчная латинская буква. Кириллическую «ы» или пробел
/// сервер не примет, а без этой проверки организатор узнает об этом только по
/// факту отказа.
final RegExp disciplineCodePattern = RegExp(r'^[a-z][a-z0-9_]{1,31}$');

/// Проверка полей справочника по правилам сервера. Возвращает текст для
/// подсказки либо null.
///
/// [code] передаётся только при создании: при переименовании код — часть URL и
/// он неизменяем (на него ссылаются `discipline_code` турниров и анкет).
/// Название сервер обрезает и требует от 3 до 120 байт UTF-8 — снова байты, а
/// не символы, потому что Go меряет `len()`.
String? disciplineError({String code = '', required String name}) {
  if (code.isNotEmpty && !disciplineCodePattern.hasMatch(code)) {
    return 'Код — 2–32 символа: строчные латинские буквы, цифры и _, '
        'начинается с буквы';
  }
  final title = name.trim();
  if (utf8Length(title) < 3) return 'Название — не короче 3 байт';
  if (utf8Length(title) > 120) return utf8LimitHint('Название', 120);
  return null;
}
