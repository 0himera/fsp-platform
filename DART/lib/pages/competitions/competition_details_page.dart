/// Карточка турнира (п.2, п.3, п.5 ТЗ в одном экране).
///
/// Все данные приходят ОДНИМ ответом `GET /api/competitions/{id}`: карточка,
/// заявки, составы команд, опубликованный протокол и флаг «я участвую». Поэтому
/// страница не склеивает четыре запроса и не показывает «половину данных».
///
/// Кнопки зависят от роли и от состояния турнира, а не от настроения:
///  • спортсмен — «подать заявку» (сервер сам откажет, если это финал без
///    прохождения отбора) и «отозвать», пока приём открыт;
///  • организатор — правка карточки, сборка команд и публикация протокола.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../entities/competition/competition.dart';
import '../../entities/registration/registration.dart';
import '../../features/admin/admin.dart';
import '../../features/auth/auth.dart';
import '../../features/competitions/competitions.dart';
import '../../features/registration/registration.dart';
import '../../shared/ui/ui.dart';
import '../../shared/utils/utils.dart';
import '../admin/admin.dart';

class CompetitionDetailsPage extends StatefulWidget {
  const CompetitionDetailsPage({super.key, required this.competitionId});

  final String competitionId;

  @override
  State<CompetitionDetailsPage> createState() => _CompetitionDetailsPageState();
}

class _CompetitionDetailsPageState extends State<CompetitionDetailsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<CompetitionDetailsController>().open(
        widget.competitionId,
      ),
    );
  }

  Future<void> _join(CompetitionDetailsController controller) async {
    final registered = await controller.join();
    if (!mounted) return;
    _toast(registered ? 'Заявка подана' : controller.error ?? 'Не вышло');
    if (registered) {
      // Список «мои заявки» живёт в другом контроллере и об этом действии не
      // знает — перечитываем его явно.
      context.read<RegistrationController>().load();
    }
  }

  void _toast(String text) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<CompetitionDetailsController>();
    final isOrganizer = context.watch<AuthController>().isOrganizer;
    final detail = controller.data;

    return Scaffold(
      appBar: AppBar(title: Text(detail?.competition.title ?? 'Соревнование')),
      body: controller.isLoading
          ? const Center(child: CircularProgressIndicator())
          : detail == null
          ? EmptyNotice(
              text: controller.error ?? 'Данные не загрузились',
              icon: Icons.error_outline,
            )
          : RefreshIndicator(
              onRefresh: controller.refresh,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _summary(detail),
                  const SizedBox(height: 12),
                  if (isOrganizer)
                    _organizerActions(detail, controller)
                  else
                    _athleteAction(detail, controller),
                  const Divider(height: 32),
                  _registrations(detail.registrations),
                  if (detail.competition.isTeam) ...[
                    const Divider(height: 32),
                    _teams(detail.teams),
                  ],
                  const Divider(height: 32),
                  _protocol(detail),
                ],
              ),
            ),
    );
  }

  // --- блоки ---------------------------------------------------------------

  Widget _summary(CompetitionDetail detail) {
    final competition = detail.competition;
    final discipline = context.read<CompetitionsController>().disciplineName(
      competition.disciplineCode,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${competition.level.label} · $discipline · ${competition.format.label} зачёт',
          style: Theme.of(context).textTheme.titleSmall,
        ),
        const SizedBox(height: 8),
        _row(
          Icons.place_outlined,
          competition.location.isEmpty
              ? 'Место не указано'
              : competition.location,
        ),
        _row(
          Icons.event_available,
          'Старт ${formatDate(competition.startsAt)}, окончание ${formatDate(competition.endsAt)}',
        ),
        _row(
          Icons.how_to_reg,
          'Заявки до ${formatDateTime(competition.registrationDeadline)}',
        ),
        _row(
          Icons.info_outline,
          '${competition.status.label} · этап: ${competition.stage.label}',
        ),
        // Для финала обязательно объясняем условие допуска: иначе «403» от
        // сервера выглядит как сломанная кнопка.
        if (competition.isGatedFinal)
          _row(
            Icons.lock_outline,
            'Проходят только ${competition.qualifyingPlaceLimit ?? '?'} призовых мест отбора',
          ),
        if (competition.description.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(competition.description),
        ],
      ],
    );
  }

  Widget _row(IconData icon, String text) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18),
        const SizedBox(width: 8),
        Expanded(child: Text(text)),
      ],
    ),
  );

  /// Спортсмен: одна кнопка, отражающая реальное положение дел.
  Widget _athleteAction(
    CompetitionDetail detail,
    CompetitionDetailsController controller,
  ) {
    final competition = detail.competition;
    final now = DateTime.now();

    if (detail.registered) {
      return Row(
        children: [
          const Expanded(child: Text('Вы участвуете')),
          // Отозвать можно, пока приём открыт: сервер иначе ответит 409.
          if (competition.isRegistrationOpen(now))
            controller.isBusy
                ? const CircularProgressIndicator()
                : TextButton(
                    onPressed: () => controller.cancel(),
                    child: const Text('Отозвать заявку'),
                  ),
        ],
      );
    }
    if (!competition.isRegistrationOpen(now)) {
      return const Text('Приём заявок закрыт');
    }
    return AppButton(
      text: 'Подать заявку',
      onPressed: controller.isBusy ? null : () => _join(controller),
    );
  }

  /// Организатор: карточка, команды, протокол.
  Widget _organizerActions(
    CompetitionDetail detail,
    CompetitionDetailsController controller,
  ) {
    final competition = detail.competition;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        OutlinedButton(
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => CompetitionFormPage(competition: competition),
            ),
          ),
          child: const Text('Править карточку'),
        ),
        if (competition.isTeam)
          OutlinedButton(
            onPressed: () => _createTeam(detail),
            child: const Text('Собрать команду'),
          ),
        // Публиковать можно не раньше старта и только незавершённый турнир:
        // сервер ответит 409, но показывать заведомо мёртвую кнопку нечего.
        if (competition.canPublishResults(DateTime.now()))
          FilledButton.icon(
            onPressed: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const ProtocolPage())),
            icon: const Icon(Icons.verified_outlined),
            label: Text(detail.hasProtocol ? 'Обновить протокол' : 'Протокол'),
          ),
      ],
    );
  }

  /// Диалог сборки состава. Кандидаты — заявки, ещё не включённые ни в одну
  /// команду: сервер отказывает, если спортсмен уже в составе, поэтому
  /// предлагать их бессмысленно.
  Future<void> _createTeam(CompetitionDetail detail) async {
    final candidates = detail.unassignedRegistrations;
    if (candidates.isEmpty) {
      _toast('Все заявители уже в составах');
      return;
    }
    final chosen = <String>{for (final r in candidates.take(2)) r.athleteId};
    final nameController = TextEditingController(
      text: 'Команда ${detail.teams.length + 1}',
    );

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          title: const Text('Новая команда'),
          content: SizedBox(
            width: 360,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Название'),
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: ListView(
                    shrinkWrap: true,
                    children: [
                      for (final registration in candidates)
                        CheckboxListTile(
                          dense: true,
                          title: Text(registration.fullName),
                          subtitle: Text(registration.organization),
                          value: chosen.contains(registration.athleteId),
                          onChanged: (checked) => setDialogState(() {
                            if (checked ?? false) {
                              chosen.add(registration.athleteId);
                            } else {
                              chosen.remove(registration.athleteId);
                            }
                          }),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Отмена'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Создать'),
            ),
          ],
        ),
      ),
    );

    if (!(confirmed ?? false)) {
      nameController.dispose();
      return;
    }
    // Проверка `mounted` ДО чтения контроллера: `context` после диалога может
    // относиться уже к размонтированной странице.
    if (!mounted) return;
    final name = nameController.text.trim();
    nameController.dispose();

    // Правила `CreateTeam` сервера: название непустое и не длиннее 100 байт,
    // участников — хотя бы один. Без этой проверки организатор получил бы от
    // сервера обезличенное «Проверьте данные соревнования и протокола» и не
    // понял бы, какого поля не хватает.
    if (name.isEmpty || utf8Length(name) > 100 || chosen.isEmpty) {
      _toast('Команде нужны название (до 100 байт) и хотя бы один участник');
      return;
    }

    final admin = context.read<AdminController>();
    final team = await admin.createTeam(
      competitionId: detail.competition.id,
      name: name,
      memberAthleteIds: chosen.toList(),
    );
    if (!mounted) return;
    _toast(
      team != null
          ? 'Команда «${team.name}» собрана'
          : admin.error ?? 'Не вышло',
    );
    if (team != null) await _refreshCard();
  }

  Future<void> _refreshCard() =>
      context.read<CompetitionDetailsController>().refresh();

  Widget _registrations(List<Registration> registrations) => _Section(
    title: 'Заявки (${registrations.length})',
    empty: 'Пока никто не зарегистрировался',
    items: [
      for (final registration in registrations)
        ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: Text(registration.fullName),
          subtitle: Text(
            '${registration.organization.isEmpty ? 'организация не указана' : registration.organization}'
            ' · ${registration.city.isEmpty ? 'город не указан' : registration.city}',
          ),
        ),
    ],
  );

  Widget _teams(List<CompetitionTeam> teams) => _Section(
    title: 'Команды (${teams.length})',
    empty: 'Составы ещё не собраны',
    items: [
      for (final team in teams)
        ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: Text(team.name),
          subtitle: Text(team.members.map((m) => m.fullName).join(', ')),
        ),
    ],
  );

  /// Опубликованный протокол (п.3 ТЗ). Места и «результат» — как их ввёл
  /// организатор; очки рейтинга отсюда не видны, они в кабинете и в рейтинге.
  Widget _protocol(CompetitionDetail detail) => _Section(
    title: 'Протокол (${detail.results.length})',
    empty: 'Результаты ещё не опубликованы',
    items: [
      for (final entry in detail.results)
        ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: CircleAvatar(child: Text('${entry.place}')),
          title: Text(
            entry.name.isEmpty ? 'Участник ${entry.entrantId}' : entry.name,
          ),
          subtitle: Text(
            entry.scoreText.isEmpty ? 'без результата' : entry.scoreText,
          ),
        ),
    ],
  );
}

/// Заголовок раздела + список или текст «пусто». Один виджет, потому что
/// таких разделов на карточке четыре и подписи должны звучать одинаково.
class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.empty,
    required this.items,
  });

  final String title;
  final String empty;
  final List<Widget> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 4),
        if (items.isEmpty)
          Text(empty, style: Theme.of(context).textTheme.bodySmall),
        ...items,
      ],
    );
  }
}
