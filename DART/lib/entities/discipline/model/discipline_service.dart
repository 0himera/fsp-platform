/// КОНТРАКТ справочника дисциплин (п.5 ТЗ: «управление справочными данными»).
///
///  • list()   -> GET /api/disciplines          (открытый эндпоинт)
///  • create() -> POST /api/disciplines         (только организатор)
///  • rename() -> PUT  /api/disciplines/{code}  (только организатор)
library;

import 'discipline.dart';

abstract class DisciplineService {
  Future<List<Discipline>> list();

  /// Код должен подходить под `^[a-z][a-z0-9_]{1,31}$`, название — 3..120
  /// символов; сервер отвечает 400 со внятным текстом, если нет.
  Future<Discipline> create({required String code, required String name});

  Future<Discipline> rename({required String code, required String name});
}
