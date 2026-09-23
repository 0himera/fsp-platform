/// Реализация контракта `DisciplineService` на mock-базе.
///
/// Дисциплины — обычная таблица: список открыт для всех, правка только у
/// организатора (проверяет `MockDatabase`, коды 401/403 те же, что у сервера).
library;

import 'package:fps_app/entities/discipline/discipline.dart';

import 'mock_database.dart';
import 'mock_transport.dart';

class MockDisciplineService implements DisciplineService {
  MockDisciplineService([MockDatabase? db]) : _db = db ?? MockDatabase.instance;

  final MockDatabase _db;

  /// GET /api/disciplines
  @override
  Future<List<Discipline>> list() => mockCall(_db.disciplines);

  /// POST /api/disciplines
  @override
  Future<Discipline> create({required String code, required String name}) =>
      mockCall(() => _db.createDiscipline(code: code, name: name));

  /// PUT /api/disciplines/{code}
  @override
  Future<Discipline> rename({required String code, required String name}) =>
      mockCall(() => _db.renameDiscipline(code: code, name: name));
}
