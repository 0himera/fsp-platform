/// Реализация контракта `DisciplineService` поверх реального бэкенда
/// (backend/internal/httpapi/disciplines.go).
library;

import '../../../shared/api/api.dart';
import 'discipline.dart';
import 'discipline_service.dart';

class DisciplineHttpService implements DisciplineService {
  DisciplineHttpService(this._api);

  final ApiClient _api;

  @override
  Future<List<Discipline>> list() async {
    // Эндпоинт открытый (без сессии): список дисциплин нужен и форме
    // регистрации, и публичному списку турниров.
    final response = await _api.get('/api/disciplines');
    return [for (final item in asJsonList(response)) Discipline.fromJson(item)];
  }

  @override
  Future<Discipline> create({
    required String code,
    required String name,
  }) async {
    final response = await _api.post(
      '/api/disciplines',
      // Ровно те ключи, что в `input` у сервера: `code` и `name`.
      body: {'code': code.trim(), 'name': name.trim()},
    );
    // Сервер отвечает тем же объектом, что попросили (201 Created).
    return Discipline.fromJson(asJsonObject(response));
  }

  @override
  Future<Discipline> rename({
    required String code,
    required String name,
  }) async {
    // Код — часть пути: он неизменяем (на него ссылаются `discipline_code`
    // соревнований и анкет), меняем только название.
    final response = await _api.put(
      '/api/disciplines/$code',
      body: {'name': name.trim()},
    );
    return Discipline.fromJson(asJsonObject(response));
  }
}
