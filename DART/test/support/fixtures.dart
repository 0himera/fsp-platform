/// Чтение фикстур — ЗАПИСАННЫХ С СЕРВЕРА ответов.
///
/// Зачем отдельный помощник: тесты должны разбирать тот же JSON, что отдаёт
/// бэкенд из `test-server/fsp-platform`, а не тот, который мы придумали. Если
/// сервер изменит поле, упадёт тест на фикстуре, а не приложение у пользователя.
///
/// Файлы лежат рядом (`test/fixtures/*.json`), путь относительный: `flutter
/// test` всегда запускается из корня проекта.
library;

import 'dart:convert';
import 'dart:io';

/// Объект-ответ (`/api/me`, `/api/rankings`, карточка турнира).
Map<String, dynamic> fixture(String name) {
  final decoded = jsonDecode(_read(name));
  if (decoded is Map<String, dynamic>) return decoded;
  throw FormatException('$name: ожидался JSON-объект, получен $decoded');
}

/// Массив-ответ (`/api/competitions`, `/api/disciplines`, `/api/me/registrations`).
List<Map<String, dynamic>> fixtureList(String name) {
  final decoded = jsonDecode(_read(name));
  if (decoded is! List) return const [];
  return [
    for (final item in decoded)
      if (item is Map<String, dynamic>) item,
  ];
}

String _read(String name) => File('test/fixtures/$name').readAsStringSync();
