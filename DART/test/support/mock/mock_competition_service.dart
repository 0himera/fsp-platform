/// Реализация контракта `CompetitionService` на mock-базе.
///
/// Проверки прав и состояния турнира — внутри `MockDatabase` (те же 401/403/409,
/// что и у сервера): повторять их здесь значило бы иметь два набора правил,
/// которые рано или поздно разошлись бы.
library;

import 'package:fps_app/entities/competition/competition.dart';
import 'package:fps_app/entities/registration/registration.dart';

import 'mock_database.dart';
import 'mock_transport.dart';

class MockCompetitionService implements CompetitionService {
  MockCompetitionService([MockDatabase? db])
    : _db = db ?? MockDatabase.instance;

  final MockDatabase _db;

  /// GET /api/competitions?status=&q=
  @override
  Future<List<Competition>> list({
    CompetitionStatus? status,
    String query = '',
  }) => mockCall(() => _db.competitionList(status: status, query: query));

  /// GET /api/competitions/{id}
  @override
  Future<CompetitionDetail> detail(String competitionId) =>
      mockCall(() => _db.competitionDetail(competitionId));

  /// POST /api/competitions
  @override
  Future<Competition> create(CompetitionDraft draft) =>
      mockCall(() => _db.createCompetition(draft));

  /// PUT /api/competitions/{id}
  @override
  Future<Competition> update(String competitionId, CompetitionDraft draft) =>
      mockCall(() => _db.updateCompetition(competitionId, draft));

  /// PUT /api/competitions/{id}/results — протокол заменяется целиком.
  @override
  Future<CompetitionDetail> publishProtocol({
    required String competitionId,
    required List<ProtocolEntry> protocol,
  }) => mockCall(
    () => _db.publishProtocol(competitionId: competitionId, protocol: protocol),
  );

  /// POST /api/competitions/{id}/teams
  @override
  Future<CompetitionTeam> createTeam({
    required String competitionId,
    required String name,
    required List<String> memberAthleteIds,
  }) => mockCall(
    () => _db.createTeam(
      competitionId: competitionId,
      name: name,
      memberAthleteIds: memberAthleteIds,
    ),
  );

  /// DELETE /api/competitions/{id}/teams/{team_id}
  @override
  Future<void> deleteTeam({
    required String competitionId,
    required String teamId,
  }) => mockCall(
    () => _db.deleteTeam(competitionId: competitionId, teamId: teamId),
  );
}
