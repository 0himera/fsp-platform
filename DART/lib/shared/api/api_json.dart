/// Разбор «сырого» ответа сервера в Map/List.
///
/// `ApiClient` возвращает то, что дал `jsonDecode`, — тип `dynamic`. Каждый
/// сервис писал бы свои `as Map<String, dynamic>` и падал бы на `null`, если
/// сервер неожиданно ответил массивом или пустым телом. Здесь это собрано в
/// двух функциях, и падают они одинаково понятно.
library;

import 'api_failure.dart';

/// Объект-ответ. Пустое тело сервера (`{}`) подходит под любую модель.
Map<String, dynamic> asJsonObject(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return value.cast<String, dynamic>();
  // Молчать нельзя: без этого «рейтинг пустой» и «сервер ответил не то»
  // выглядели бы для пользователя одинаково.
  throw const ApiFailure(
    'Сервер вернул не тот формат ответа. Обновите клиент.',
    statusCode: 0,
  );
}

/// Массив объектов-ответа. Не список (или `null`) трактуем как пусто: сервер
/// всегда инициализирует срезы как `[]`, но пустой список — это не ошибка.
List<Map<String, dynamic>> asJsonList(dynamic value) {
  if (value is! List) return const [];
  return [
    for (final item in value)
      if (item is Map<String, dynamic>)
        item
      else if (item is Map)
        item.cast<String, dynamic>(),
  ];
}
