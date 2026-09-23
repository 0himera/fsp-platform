/// КОНТРАКТ работы с соревнованиями (п.2 и п.5 ТЗ).
///
/// Эндопоинты (backend/internal/httpapi/competitions.go):
///  • list()      -> GET    /api/competitions?status=&q=
///  • detail()    -> GET    /api/competitions/{id}
///  • create()    -> POST   /api/competitions           (только организатор)
///  • update()    -> PUT    /api/competitions/{id}       (только организатор)
///  • publishProtocol() -> PUT /api/competitions/{id}/results (только организатор)
///  • createTeam()-> POST   /api/competitions/{id}/teams
///  • deleteTeam() -> DELETE /api/competitions/{id}/teams/{team_id}
///
/// Права проверяет СЕРВЕР (403 «Недостаточно прав»). Клиент прячет админские
/// кнопки — это забота об UX, а не защита: защита на бэкенде.
library;

import '../../registration/registration.dart';
import 'competition.dart';
import 'competition_detail.dart';
import 'competition_draft.dart';
import 'competition_enums.dart';
import 'protocol_entry.dart';

abstract class CompetitionService {
  /// Список турниров. Фильтр по статусу и поиск по названию делает сервер
  /// (`status`, `q`) — так в выборке заведомо нет «лишнего», и пагинация
  /// останется на сервере, когда турниры вырастут до тысяч.
  Future<List<Competition>> list({
    CompetitionStatus? status,
    String query = '',
  });

  /// Карточка: заявки, составы, протокол, флаг «я участвую».
  Future<CompetitionDetail> detail(String competitionId);

  Future<Competition> create(CompetitionDraft draft);

  Future<Competition> update(String competitionId, CompetitionDraft draft);

  /// Опубликовать итоговый протокол (п.3 ТЗ «внесение результатов»).
  ///
  /// Это НЕ «добавить строчку»: сервер заменяет весь протокол целиком,
  /// транзакционно, а предыдущую версию сохраняет в `result_publications`.
  /// Отсюда и сигнатура — просим полный список, а не одну запись.
  /// Ответ сервера — та же карточка соревнования, что и `detail()` (уже с
  /// результатами и флагом «завершено»), поэтому возвращаем `CompetitionDetail`.
  Future<CompetitionDetail> publishProtocol({
    required String competitionId,
    required List<ProtocolEntry> protocol,
  });

  /// Собрать команду из зарегистрированных спортсменов.
  Future<CompetitionTeam> createTeam({
    required String competitionId,
    required String name,
    required List<String> memberAthleteIds,
  });

  Future<void> deleteTeam({
    required String competitionId,
    required String teamId,
  });
}
