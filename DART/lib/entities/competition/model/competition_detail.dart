/// Всё, что сервер отдаёт по `GET /api/competitions/{id}` одним ответом:
/// карточка + заявки + составы команд + протокол + флаг «я уже участвую».
///
/// ПОЧЕМУ ОДНИМ КУСОМ: карточка турнира без списка участников всё равно
/// «доспрашивала» бы их, а клиент при этом показал бы миг пустоты. Сервер
/// собирает это одной функцией (`competitionDetail`), и мы отражаем форму
/// ответа один-в-один.
library;

import '../../registration/registration.dart';
import 'competition.dart';
import 'protocol_entry.dart';

class CompetitionDetail {
  const CompetitionDetail({
    required this.competition,
    required this.registrations,
    required this.teams,
    required this.results,
    required this.registered,
  });

  /// Пустой ответ — допустимое состояние, а не ошибка: например, мы открыли
  /// карточку турнира, у которого ещё нет ни одной заявки.
  factory CompetitionDetail.fromJson(Map<String, dynamic> json) {
    List<T> list<T>(Object? raw, T Function(Map<String, dynamic>) parse) {
      if (raw is! List) return const [];
      return [
        for (final item in raw)
          if (item is Map<String, dynamic>) parse(item),
      ];
    }

    return CompetitionDetail(
      competition: Competition.fromJson(
        (json['competition'] as Map?)?.cast<String, dynamic>() ?? const {},
      ),
      registrations: list(json['registrations'], Registration.fromJson),
      teams: list(json['teams'], CompetitionTeam.fromJson),
      results: list(json['results'], ProtocolEntry.fromJson),
      // Сервер считает флаг сам, по сессии: спортсмен видит true, а
      // организатор или гость — false. Клиенту остаётся показать кнопку.
      registered: json['registered'] as bool? ?? false,
    );
  }

  final Competition competition;

  /// Заявки (для организатора — «список участников» п.5 ТЗ).
  final List<Registration> registrations;

  /// Сформированные организатором составы (п.4 основного сценария сервера).
  final List<CompetitionTeam> teams;

  /// Опубликованный протокол. Пустой, пока results_count = 0.
  final List<ProtocolEntry> results;
  final bool registered;

  bool get hasProtocol => results.isNotEmpty;

  /// id участников, ещё не включённых ни в одну команду — из них строятся
  /// составы, и только из них сервер разрешит собрать команду.
  List<Registration> get unassignedRegistrations {
    final taken = {
      for (final team in teams)
        for (final m in team.members) m.athleteId,
    };
    return [
      for (final r in registrations)
        if (!taken.contains(r.athleteId)) r,
    ];
  }
}
