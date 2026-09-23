/// Карточка турнира — переиспользуемый кусок списка (п.2 ТЗ).
///
/// Один виджет на три списка: «турниры», «мои заявки», «мои созданные» в
/// админке. Различаются они только подписью и кнопкой справа (`trailing`),
/// поэтому плодить три почти одинаковые карточки — значит однажды поправить
/// две из трёх.
///
/// Название дисциплины берётся из `CompetitionsController`: сервер передаёт
/// код (`uav`), а человек должен видеть «БПЛА».
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../entities/competition/competition.dart';
import '../../features/competitions/competitions.dart';
import '../../shared/utils/utils.dart';
import 'competitions.dart';

class CompetitionTile extends StatelessWidget {
  const CompetitionTile({
    super.key,
    required this.competition,
    this.trailing,
    this.openOnTap = true,
  });

  final Competition competition;

  /// Кнопка справа (отозвать заявку, редактировать черновик). Пусто — карточка
  /// только для просмотра.
  final Widget? trailing;

  /// Ведёт ли нажатие в карточку турнира. В админке иногда нужен свой обработчик.
  final bool openOnTap;

  @override
  Widget build(BuildContext context) {
    final discipline = context.watch<CompetitionsController>().disciplineName(
      competition.disciplineCode,
    );
    final now = DateTime.now();

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: ListTile(
        title: Text(competition.title),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$discipline · ${competition.level.label} · ${competition.format.label} зачёт',
            ),
            Text(
              '${competition.location.isEmpty ? 'Место не указано' : competition.location} · ${formatDate(competition.startsAt)}',
            ),
            // Три числа, которые важны спортсмену до открытия карточки:
            // статус, сколько заявок и есть ли уже протокол.
            Text(
              '${competition.status.label}'
              ' · заявок: ${competition.registrationsCount}'
              '${competition.resultsCount > 0 ? ' · протокол: ${competition.resultsCount}' : ''}'
              '${competition.isGatedFinal ? ' · финал: проход ${competition.qualifyingPlaceLimit ?? '?'}' : ''}',
              style: TextStyle(
                // Просроченный дедлайн всё ещё может висеть со статусом
                // «открыто» (сервер меняет статус только публикацией), поэтому
                // подсвечиваем факт «приём закрыт по времени».
                color:
                    competition.status == CompetitionStatus.open &&
                        !competition.isRegistrationOpen(now)
                    ? Theme.of(context).colorScheme.error
                    : null,
              ),
            ),
          ],
        ),
        isThreeLine: true,
        trailing: trailing,
        onTap: openOnTap
            ? () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      CompetitionDetailsPage(competitionId: competition.id),
                ),
              )
            : null,
      ),
    );
  }
}
