/// Таблица рейтинга (п.4 ТЗ — ключевой модуль).
///
/// Порядок и места приходят С СЕРВЕРА: `GET /api/rankings` отдаёт спортсменов,
/// уже отсортированных по очкам, с общим местом при равной сумме. Клиент
/// ничего не пересчитывает — иначе таблица и кабинет начали бы расходиться.
///
/// Фильтры локальные: сервер отдаёт весь рейтинг одним запросом без параметров,
/// поэтому резать список по строке поиска и дисциплине дешевле здесь.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../entities/athlete/athlete.dart';
import '../../features/competitions/competitions.dart';
import '../../features/rating/rating.dart';
import '../../shared/ui/ui.dart';
import '../../shared/utils/utils.dart';

class RatingPage extends StatefulWidget {
  const RatingPage({super.key});

  @override
  State<RatingPage> createState() => _RatingPageState();
}

class _RatingPageState extends State<RatingPage> {
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<RatingController>().load(),
    );
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<RatingController>();
    final disciplines = context.watch<CompetitionsController>();
    // Дисциплины для фильтра — из самого рейтинга, а не из отдельного запроса:
    // список уже в памяти, и спрашивать ради чипов справочник не нужно.
    final codes = <String>{
      for (final athlete in controller.athletes) ...athlete.disciplineCodes,
    }.toList()..sort();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: TextField(
            controller: _search,
            decoration: const InputDecoration(
              hintText: 'ФИО, организация или город',
              prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
              isDense: true,
            ),
            onChanged: controller.search,
          ),
        ),
        if (codes.isNotEmpty)
          SizedBox(
            height: 54,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              children: [
                for (final code in codes)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(disciplines.disciplineName(code)),
                      selected: controller.disciplineCode == code,
                      onSelected: (_) => controller.filterDiscipline(code),
                    ),
                  ),
              ],
            ),
          ),
        if (controller.isLoading) const LinearProgressIndicator(),
        if (controller.error != null)
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              controller.error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        Expanded(
          child: controller.visible.isEmpty && !controller.isLoading
              ? const EmptyNotice(
                  text: 'Никого не найдено. Попробуйте снять фильтр.',
                  icon: Icons.person_search_outlined,
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: controller.visible.length,
                  itemBuilder: (context, index) {
                    final athlete = controller.visible[index];
                    return ListTile(
                      leading: _Place(place: athlete.ratingPlace),
                      title: Text(athlete.fullName),
                      subtitle: Text(
                        '${athlete.organization.isEmpty ? 'организация не указана' : athlete.organization}'
                        ' · разряд: ${athlete.rank?.label ?? '—'}',
                      ),
                      trailing: Text(
                        '${athlete.rating}',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      onTap: () => _explain(athlete),
                    );
                  },
                ),
        ),
        // Момент расчёта и версия правил — под таблицей: без них цифры
        // выглядят «истинными сейчас», хотя посчитаны когда-то.
        Padding(
          padding: const EdgeInsets.all(12),
          child: Text(
            _footnote(controller),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }

  String _footnote(RatingController controller) {
    final asOf = controller.asOf;
    final rules = controller.rulesVersion;
    final parts = <String>[
      if (asOf != null) 'Расчёт на ${formatDateTime(asOf)}',
      if (rules.isNotEmpty) 'правила $rules',
    ];
    return parts.isEmpty ? '' : parts.join(' · ');
  }

  /// Объснение чисел по спортсмену (вторая половина п.4 ТЗ: не только
  /// посчитать, но и обосновать).
  Future<void> _explain(Athlete athlete) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (_) => Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(athlete.fullName, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(RatingController.explain(athlete)),
          const SizedBox(height: 12),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final result in athlete.results)
                  ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(result.competitionTitle),
                    subtitle: Text(
                      '${result.place} из ${result.finishers} · '
                      '${result.base} × ${result.placeFactor} × '
                      '${result.sizeFactor} × ${result.relativeFactor} × '
                      '${result.decay}',
                    ),
                    trailing: Text('${result.points}'),
                  ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

/// Место в таблице. `0` сервер отдаёт, когда рейтинга ещё нет — показываем
/// прочерк вместо «0-е место», которое читалось бы как результат.
class _Place extends StatelessWidget {
  const _Place({required this.place});

  final int place;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      backgroundColor: place <= 3 && place > 0
          ? Theme.of(context).colorScheme.primaryContainer
          : null,
      child: Text(place > 0 ? '$place' : '—'),
    );
  }
}
