/// Экран итогового протокола для организатора (п.3 и п.5 ТЗ).
///
/// ПОЧЕМУ ЭКРАН ОТДЕЛЬНЫЙ: сервер принимает протокол только ЦЕЛИКОМ
/// (`PUT /api/competitions/{id}/results` заменяет все строки в транзакции),
/// поэтому здесь нельзя «сохранить одну запись» — здесь редактируют список и
/// отправляют его один раз.
///
/// ПОЛЕЙ «ДОБАВИТЬ УЧАСТНИКА» НЕТ НАМЕРЕННО: право на строку в протоколе даёт
/// заявка (личный зачёт) или собранная команда (командный). Спортсмена без
/// заявки сервер отвергнет с 400, поэтому список берётся из карточки турнира,
/// а организатору остаются место, результат и удаление неявившихся.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../entities/competition/competition.dart';
import '../../features/competitions/competitions.dart';
import '../../features/results/results.dart';
import '../../shared/ui/ui.dart';

class ProtocolPage extends StatefulWidget {
  const ProtocolPage({super.key});

  @override
  State<ProtocolPage> createState() => _ProtocolPageState();
}

class _ProtocolPageState extends State<ProtocolPage> {
  @override
  void initState() {
    super.initState();
    // Черновик набирается из уже загруженной карточки турнира (страница
    // открывается только из неё), поэтому отдельного запроса здесь нет.
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }

  @override
  void dispose() {
    // Черновик живёт в глобальном контроллере: если его не сбросить, следующий
    // открытый турнир получит строки от предыдущего.
    context.read<ResultsController>().clear();
    super.dispose();
  }

  void _start() {
    final detail = context.read<CompetitionDetailsController>().data;
    if (detail == null || !mounted) return;
    context.read<ResultsController>().startFrom(detail);
  }

  Future<void> _publish() async {
    final results = context.read<ResultsController>();
    final details = context.read<CompetitionDetailsController>();
    final updated = await results.publish();
    if (!mounted) return;
    if (updated == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(results.error ?? 'Протокол не опубликован')),
      );
      return;
    }
    // Карточку обновляем обязательно: публикация меняет статус турнира на
    // «завершено» и счётчик результатов, а считает это сервер.
    await details.refresh();
    if (!mounted) return;
    Navigator.of(context).pop(updated);
  }

  @override
  Widget build(BuildContext context) {
    final results = context.watch<ResultsController>();
    final detail = results.source;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Протокол'),
        actions: [
          if (detail != null)
            IconButton(
              tooltip: 'Проставить места 1..N по порядку',
              icon: const Icon(Icons.format_list_numbered),
              onPressed: results.rows.isEmpty ? null : results.renumber,
            ),
        ],
      ),
      body: detail == null
          ? const EmptyNotice(
              text:
                  'Соревнование не выбрано: откройте протокол из его карточки',
              icon: Icons.assignment_outlined,
            )
          : Column(
              children: [
                _Header(detail: detail, results: results),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                    itemCount: results.rows.length,
                    itemBuilder: (_, index) => _Row(entry: results.rows[index]),
                  ),
                ),
                _Footer(results: results, onPublish: _publish),
              ],
            ),
    );
  }
}

/// Шапка с контекстом: по какому турниру протокол и каким правилам он должен
/// отвечать. Формат зачёта показан специально — он определяет, кому даётся
/// место (спортсмену или команде), и сервер сверяет строки именно с ним.
class _Header extends StatelessWidget {
  const _Header({required this.detail, required this.results});

  final CompetitionDetail detail;
  final ResultsController results;

  @override
  Widget build(BuildContext context) {
    final competition = detail.competition;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            competition.title,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          Text(
            '${competition.format.label} зачёт · ${competition.level.label} · '
            'строк: ${results.rows.length}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (detail.hasProtocol)
            Text(
              'Протокол уже опубликован — публикация заменит его целиком, '
              'а прежняя версия сохранится в истории результатов.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.entry});

  final ProtocolEntry entry;

  @override
  Widget build(BuildContext context) {
    final results = context.read<ResultsController>();
    final total = results.rows.length;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 5),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 4, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  entry.isTeam ? Icons.groups_outlined : Icons.person_outline,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    entry.name.isEmpty
                        ? 'Участник ${entry.entrantId}'
                        : entry.name,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
                IconButton(
                  tooltip: 'Убрать из протокола',
                  icon: const Icon(Icons.close),
                  onPressed: () => results.remove(entry.entrantId),
                ),
              ],
            ),
            Row(
              children: [
                // Место — выпадающий список, а не поле ввода: допустимый
                // диапазон (1..число строк) известен, и ошибка ввода здесь
                // дороже — сервер ответит 400 на весь протокол.
                SizedBox(
                  width: 120,
                  child: DropdownButtonFormField<int>(
                    initialValue: entry.place.clamp(1, total),
                    decoration: const InputDecoration(labelText: 'Место'),
                    items: [
                      for (var place = 1; place <= total; place++)
                        DropdownMenuItem(value: place, child: Text('$place')),
                    ],
                    onChanged: (value) =>
                        results.edit(entry.entrantId, place: value),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    // Ключ по участнику, а не по месту: поле переживает
                    // перенумерацию строк и не теряет ввод.
                    key: ValueKey('score-${entry.entrantId}'),
                    initialValue: entry.scoreText,
                    maxLength: 200,
                    decoration: const InputDecoration(
                      labelText: 'Результат',
                      helperText: 'например: 8 из 10 задач',
                      counterText: '',
                    ),
                    onChanged: (value) =>
                        results.edit(entry.entrantId, scoreText: value),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Подвал с причиной блокировки и кнопкой публикации.
class _Footer extends StatelessWidget {
  const _Footer({required this.results, required this.onPublish});

  final ResultsController results;

  /// Публикация живёт на странице: ей нужно обновить карточку турнира и закрыть
  /// экран, а виджет-подвал не должен знать навигацию.
  final Future<void> Function() onPublish;

  @override
  Widget build(BuildContext context) {
    final problem = results.problem;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (problem != null)
              Padding(
                // Подсказка показана до отправки: те же правила проверяет
                // сервер, но там ответ — безликое «Проверьте данные…».
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  problem,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            if (results.error != null && problem == null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  results.error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            AppButton(
              text: results.isLoading ? 'Публикуем…' : 'Опубликовать протокол',
              onPressed: problem != null || results.isLoading
                  ? null
                  : onPublish,
            ),
          ],
        ),
      ),
    );
  }
}
