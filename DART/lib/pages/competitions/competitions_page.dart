/// Список соревнований с фильтром по статусу и поиском (п.2 ТЗ).
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../entities/competition/competition.dart';
import '../../features/competitions/competitions.dart';
import '../../shared/ui/ui.dart';
import 'competitions.dart';

class CompetitionsPage extends StatefulWidget {
  const CompetitionsPage({super.key});

  @override
  State<CompetitionsPage> createState() => _CompetitionsPageState();
}

class _CompetitionsPageState extends State<CompetitionsPage> {
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Первый экран после входа обязан быть с данными, поэтому грузим сразу.
    // PostFrame — потому что в initState дерево ещё не готово, а
    // `context.read` из него дёргать нельзя.
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<CompetitionsController>().load(),
    );
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<CompetitionsController>();

    return RefreshIndicator(
      onRefresh: controller.load,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
            child: TextField(
              controller: _search,
              decoration: const InputDecoration(
                hintText: 'Поиск по названию',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
                isDense: true,
              ),
              // Поиск по «отправить», а не по каждому символу: запрос идёт на
              // сервер (`?q=`), и на каждое нажатие клавиши был бы round-trip.
              onSubmitted: controller.search,
            ),
          ),
          SizedBox(
            height: 56,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              children: [
                _chip(label: 'все', value: null, controller: controller),
                for (final status in CompetitionStatus.values)
                  _chip(
                    label: status.label,
                    value: status,
                    controller: controller,
                  ),
              ],
            ),
          ),
          if (controller.error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      controller.error!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: controller.load,
                    child: const Text('Повторить'),
                  ),
                ],
              ),
            ),
          if (controller.isLoading) const LinearProgressIndicator(),
          Expanded(
            child: controller.items.isEmpty && !controller.isLoading
                ? const EmptyNotice(
                    text: 'Турниров по этому фильтру нет.',
                    icon: Icons.emoji_events_outlined,
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: controller.items.length,
                    itemBuilder: (context, index) =>
                        CompetitionTile(competition: controller.items[index]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _chip({
    required String label,
    required CompetitionStatus? value,
    required CompetitionsController controller,
  }) {
    final selected = controller.status == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        // Выбор активного фильтра снимает его: «показать всё» в один тап.
        onSelected: (_) => controller.filterStatus(selected ? null : value),
      ),
    );
  }
}
