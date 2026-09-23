/// Команда в командном зачёте (`competitions.Team` на сервере).
///
/// П.4 основного сценария сервера: для командного формата организатор собирает
/// составы из ЗАРЕГИСТРИРОВАННЫХ спортсменов, а протокол затем выставляет места
/// командам, а не людям; очки получает каждый член итогового состава без деления
/// на размер команды (см. README, раздел «Рейтинг arena-2»).
library;

import 'registration.dart';

class CompetitionTeam {
  const CompetitionTeam({
    required this.id,
    required this.name,
    required this.members,
  });

  final String id;
  final String name;

  /// Состав. Сервер отдаёт тех же `Registration`-строк, что и список заявок.
  final List<Registration> members;

  factory CompetitionTeam.fromJson(Map<String, dynamic> json) {
    final raw = json['members'];
    return CompetitionTeam(
      id: '${json['id'] ?? ''}',
      name: json['name'] as String? ?? '',
      members: raw is List
          ? [
              for (final item in raw)
                if (item is Map<String, dynamic> && item['athlete_id'] != null)
                  Registration.fromJson(item),
            ]
          : const [],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': int.tryParse(id) ?? id,
    'name': name,
    'members': members.map((m) => m.toJson()).toList(),
  };

  /// Команду нельзя удалить/изменить, если протокол уже опубликован — но это
  /// решение сервера, клиент лишь подсказывает организатору.
  bool get isEmpty => members.isEmpty;
}
