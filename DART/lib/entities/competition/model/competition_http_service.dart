/// Реализация контракта `CompetitionService` поверх реального бэкенда
/// (backend/internal/httpapi/competitions.go).
///
/// Прав на «кто может создавать/публиковать» здесь нет ни одной строки — их
/// проверяет сервер (`requireUser(..., "organizer")`, 403). Клиент повторяет
/// их только в одном: какие кнопки показывать.
library;

import '../../../shared/api/api.dart';
import '../../registration/registration.dart';
import 'competition.dart';
import 'competition_detail.dart';
import 'competition_draft.dart';
import 'competition_enums.dart';
import 'competition_service.dart';
import 'protocol_entry.dart';

class CompetitionHttpService implements CompetitionService {
  CompetitionHttpService(this._api);

  final ApiClient _api;

  @override
  Future<List<Competition>> list({
    CompetitionStatus? status,
    String query = '',
  }) async {
    final response = await _api.get(
      '/api/competitions',
      query: {'status': status?.jsonKey ?? '', 'q': query.trim()},
    );
    return [
      for (final item in asJsonList(response)) Competition.fromJson(item),
    ];
  }

  @override
  Future<CompetitionDetail> detail(String competitionId) async =>
      CompetitionDetail.fromJson(
        asJsonObject(await _api.get('/api/competitions/$competitionId')),
      );

  @override
  Future<Competition> create(CompetitionDraft draft) async {
    _check(draft);
    return Competition.fromJson(
      asJsonObject(await _api.post('/api/competitions', body: draft.toJson())),
    );
  }

  @override
  Future<Competition> update(
    String competitionId,
    CompetitionDraft draft,
  ) async {
    _check(draft);
    return Competition.fromJson(
      asJsonObject(
        await _api.put(
          '/api/competitions/$competitionId',
          body: draft.toJson(),
        ),
      ),
    );
  }

  @override
  Future<CompetitionDetail> publishProtocol({
    required String competitionId,
    required List<ProtocolEntry> protocol,
  }) async {
    // Протокол здесь НЕ проверяется: `validateProtocol` на сервере работает ВМЕСТЕ
    // с форматом турнира (личное место — спортсмену, командное — команде), а
    // формата у этого метода нет — только id. Полную проверку с известным
    // форматом делает `ResultsController`, а сервер перепроверит в любом случае
    // и ответит 400.
    // PUT заменяет протокол целиком, поэтому тело — список, а не одна запись.
    final response = await _api.put(
      '/api/competitions/$competitionId/results',
      body: {
        'results': [for (final entry in protocol) entry.toPublishJson()],
      },
    );
    // Сервер в ответ отдаёт полную карточку: с новым статусом, результатами и
    // количеством заявок — перечитывать её отдельным запросом не нужно.
    return CompetitionDetail.fromJson(asJsonObject(response));
  }

  @override
  Future<CompetitionTeam> createTeam({
    required String competitionId,
    required String name,
    required List<String> memberAthleteIds,
  }) async {
    final response = await _api.post(
      '/api/competitions/$competitionId/teams',
      body: {
        'name': name.trim(),
        // Сервер ждёт числа (`[]int64`), а id у нас строки — конвертируем тут,
        // а не в модели: наружу уходит формат, который понял бы Go.
        'member_ids': [
          for (final id in memberAthleteIds) int.tryParse(id) ?? 0,
        ],
      },
    );
    return CompetitionTeam.fromJson(asJsonObject(response));
  }

  @override
  Future<void> deleteTeam({
    required String competitionId,
    required String teamId,
  }) async {
    await _api.delete('/api/competitions/$competitionId/teams/$teamId');
  }

  /// Локальная проверка черновика до запроса.
  ///
  /// Дело не в экономии трафика: без неё организатор узнал бы про пустое
  /// название из 400-го ответа с текстом от сервера, а с ней — из того же
  /// текста, но до всякой сети.
  void _check(CompetitionDraft draft) {
    final problem = draft.validationError;
    if (problem != null) throw ApiFailure(problem, statusCode: 0);
  }
}
