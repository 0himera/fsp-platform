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
      context.read<RegistrationController>().load();
    }
  }

  void _toast(String text) => ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(text),
      backgroundColor: AppTheme.surfaceElevated,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: AppTheme.border),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<CompetitionDetailsController>();
    final isOrganizer = context.watch<AuthController>().isOrganizer;
    final detail = controller.data;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(detail?.competition.title ?? 'Турнир'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTheme.border, height: 1),
        ),
      ),
      body: controller.isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation(AppTheme.textPrimary),
              ),
            )
          : detail == null
          ? EmptyNotice(
              text: controller.error ?? 'Данные не загрузились',
              icon: Icons.error_outline,
            )
          : RefreshIndicator(
              backgroundColor: AppTheme.surfaceElevated,
              color: AppTheme.textPrimary,
              onRefresh: controller.refresh,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                children: [
                  _summary(detail),
                  const SizedBox(height: 16),
                  if (isOrganizer)
                    _organizerActions(detail, controller)
                  else
                    _athleteAction(detail, controller),
                  const SizedBox(height: 24),
                  _registrations(detail.registrations),
                  if (detail.competition.isTeam) ...[
                    const SizedBox(height: 24),
                    _teams(detail.teams),
                  ],
                  const SizedBox(height: 24),
                  _protocol(detail),
                ],
              ),
            ),
    );
  }

  Widget _summary(CompetitionDetail detail) {
    final competition = detail.competition;
    final discipline = context.read<CompetitionsController>().disciplineName(
      competition.disciplineCode,
    );
    final now = DateTime.now();
    final isRegClosed = competition.status == CompetitionStatus.open && !competition.isRegistrationOpen(now);

    final (statusBg, statusFg) = switch (competition.status) {
      CompetitionStatus.open => isRegClosed
          ? (AppTheme.error.withValues(alpha: 0.12), AppTheme.error)
          : (AppTheme.success.withValues(alpha: 0.12), AppTheme.success),
      CompetitionStatus.running => (AppTheme.warning.withValues(alpha: 0.12), AppTheme.warning),
      _ => (AppTheme.surfaceElevated, AppTheme.textTertiary),
    };

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.border),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.tagBg,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Text(
                  discipline.isEmpty ? competition.disciplineCode : discipline,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  competition.status.label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: statusFg,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            competition.title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.4,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 14),
          _detailRow(Icons.layers_outlined, 'Уровень и формат', '${competition.level.label} · ${competition.format.label} зачёт'),
          _detailRow(Icons.location_on_outlined, 'Место проведения', competition.location.isEmpty ? 'Место не указано' : competition.location),
          _detailRow(Icons.calendar_today_outlined, 'Даты проведения', '${formatDate(competition.startsAt)} — ${formatDate(competition.endsAt)}'),
          _detailRow(Icons.event_available_outlined, 'Дедлайн приёма заявок', formatDate(competition.registrationDeadline)),
          if (competition.isGatedFinal)
            _detailRow(Icons.star_outline_rounded, 'Финал с отбором', 'Проходное место: ${competition.qualifyingPlaceLimit ?? "?"}'),
          if (competition.description.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF101217),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.border),
              ),
              child: Text(
                competition.description,
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppTheme.textTertiary),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                children: [
                  TextSpan(text: '$label: ', style: const TextStyle(color: AppTheme.textTertiary)),
                  TextSpan(text: value, style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _athleteAction(CompetitionDetail detail, CompetitionDetailsController controller) {
    final competition = detail.competition;
    final now = DateTime.now();

    if (detail.registered) {
      if (competition.isRegistrationOpen(now)) {
        return AppButton(
          text: 'Отозвать заявку',
          color: AppTheme.error.withValues(alpha: 0.15),
          textColor: AppTheme.error,
          onPressed: () async {
            final cancelled = await controller.cancel();
            if (!mounted) return;
            _toast(cancelled ? 'Заявка отозвана' : controller.error ?? 'Не вышло');
            if (cancelled) context.read<RegistrationController>().load();
          },
        );
      }
      return Container(
        padding: const EdgeInsets.all(14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppTheme.success.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: AppTheme.success.withValues(alpha: 0.3)),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline_rounded, size: 18, color: AppTheme.success),
            SizedBox(width: 8),
            Text(
              'Вы участвуете в турнире',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.success),
            ),
          ],
        ),
      );
    }

    if (!competition.isRegistrationOpen(now)) {
      return Container(
        padding: const EdgeInsets.all(14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: AppTheme.border),
        ),
        child: const Text(
          'Регистрация закрыта',
          style: TextStyle(fontSize: 14, color: AppTheme.textTertiary),
        ),
      );
    }

    return AppButton(
      text: 'Подать заявку на участие',
      onPressed: () => _join(controller),
    );
  }

  Widget _organizerActions(CompetitionDetail detail, CompetitionDetailsController controller) {
    final competition = detail.competition;

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        if (competition.status == CompetitionStatus.draft)
          AppButton(
            text: 'Редактировать',
            icon: Icons.edit_outlined,
            color: AppTheme.surfaceElevated,
            textColor: AppTheme.textPrimary,
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CompetitionFormPage()),
            ),
          ),
        if (competition.isTeam)
          AppButton(
            text: 'Собрать команду',
            icon: Icons.group_add_outlined,
            color: AppTheme.surfaceElevated,
            textColor: AppTheme.textPrimary,
            onPressed: () => _createTeam(detail),
          ),
        if (competition.canPublishResults(DateTime.now()))
          AppButton(
            text: detail.hasProtocol ? 'Обновить протокол' : 'Опубликовать протокол',
            icon: Icons.assignment_outlined,
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ProtocolPage()),
            ),
          ),
      ],
    );
  }

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
                  decoration: const InputDecoration(labelText: 'Название команды'),
                ),
                const SizedBox(height: 14),
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
              child: const Text('Отмена', style: TextStyle(color: AppTheme.textTertiary)),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.textPrimary,
                foregroundColor: AppTheme.background,
              ),
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
    if (!mounted) return;
    final name = nameController.text.trim();
    nameController.dispose();

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
            '${registration.organization.isEmpty ? "организация не указана" : registration.organization}'
            ' · ${registration.city.isEmpty ? "город не указан" : registration.city}',
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

  Widget _protocol(CompetitionDetail detail) => _Section(
    title: 'Протокол (${detail.results.length})',
    empty: 'Результаты ещё не опубликованы',
    items: [
      for (final entry in detail.results)
        ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppTheme.surfaceElevated,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.border),
            ),
            child: Text(
              '${entry.place}',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.textPrimary),
            ),
          ),
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
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 15.5,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.3,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          if (items.isEmpty)
            Text(
              empty,
              style: const TextStyle(fontSize: 13, color: AppTheme.textTertiary),
            )
          else
            ...items,
        ],
      ),
    );
  }
}
