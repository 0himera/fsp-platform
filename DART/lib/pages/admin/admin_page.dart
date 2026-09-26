library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../entities/athlete/athlete.dart';
import '../../entities/discipline/discipline.dart';
import '../../features/admin/admin.dart';
import '../../features/competitions/competitions.dart';
import '../../shared/ui/ui.dart';
import '../competitions/competitions.dart';
import 'admin.dart';

class AdminPage extends StatefulWidget {
  const AdminPage({super.key});

  @override
  State<AdminPage> createState() => _AdminPageState();
}

class _AdminPageState extends State<AdminPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminController>().load();
      final competitions = context.read<CompetitionsController>();
      if (competitions.items.isEmpty) competitions.load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppTheme.background,
        body: Column(
          children: [
            Container(
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppTheme.border)),
              ),
              child: const TabBar(
                indicatorColor: AppTheme.textPrimary,
                indicatorWeight: 2,
                labelColor: AppTheme.textPrimary,
                unselectedLabelColor: AppTheme.textTertiary,
                labelStyle: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                unselectedLabelStyle: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                tabs: [
                  Tab(text: 'Турниры'),
                  Tab(text: 'Разряды'),
                  Tab(text: 'Дисциплины'),
                ],
              ),
            ),
            const _ErrorBar(),
            const Expanded(
              child: TabBarView(
                children: [
                  _CompetitionsTab(),
                  _RanksTab(),
                  _DisciplinesTab(),
                ],
              ),
            ),
          ],
        ),
        floatingActionButton: Builder(
          builder: (context) => FloatingActionButton(
            backgroundColor: AppTheme.textPrimary,
            foregroundColor: AppTheme.background,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CompetitionFormPage()),
            ),
            tooltip: 'Новый турнир',
            child: const Icon(Icons.add_rounded, size: 24),
          ),
        ),
      ),
    );
  }
}

class _ErrorBar extends StatelessWidget {
  const _ErrorBar();

  @override
  Widget build(BuildContext context) {
    final error = context.watch<AdminController>().error;
    if (error == null) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      color: AppTheme.error.withValues(alpha: 0.12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        error,
        style: const TextStyle(color: AppTheme.error, fontSize: 13),
      ),
    );
  }
}

class _CompetitionsTab extends StatelessWidget {
  const _CompetitionsTab();

  @override
  Widget build(BuildContext context) {
    final competitions = context.watch<CompetitionsController>();
    if (competitions.items.isEmpty) {
      return const EmptyNotice(
        text: 'Турниров пока нет. Создайте первый кнопкой «+».',
        icon: Icons.emoji_events_outlined,
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
      itemCount: competitions.items.length,
      itemBuilder: (context, index) {
        final item = competitions.items[index];
        return CompetitionTile(
          competition: item,
          trailing: IconButton(
            tooltip: 'Редактировать',
            icon: const Icon(Icons.edit_outlined, size: 20, color: AppTheme.textSecondary),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => CompetitionFormPage(competition: item),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _RanksTab extends StatelessWidget {
  const _RanksTab();

  Future<void> _setRank(
    BuildContext context,
    Athlete athlete,
    AthleteRank? rank,
  ) async {
    final admin = context.read<AdminController>();
    final updated = await admin.changeRank(athlete.id, rank);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          updated == null
              ? admin.error ?? 'Не вышло'
              : '${updated.fullName}: ${updated.rank?.label ?? "разряд снят"}',
        ),
        backgroundColor: AppTheme.surfaceElevated,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: AppTheme.border),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminController>();
    if (admin.athletes.isEmpty) {
      return const EmptyNotice(text: 'Спортсменов пока нет', icon: Icons.people_outline);
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
      itemCount: admin.athletes.length,
      itemBuilder: (context, index) {
        final athlete = admin.athletes[index];
        return Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      athlete.fullName,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Рейтинг: ${athlete.rating}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textTertiary),
                    ),
                  ],
                ),
              ),
              DropdownButton<AthleteRank?>(
                value: athlete.rank,
                dropdownColor: AppTheme.surfaceElevated,
                underline: const SizedBox.shrink(),
                hint: const Text('—', style: TextStyle(color: AppTheme.textTertiary)),
                items: [
                  const DropdownMenuItem<AthleteRank?>(
                    value: null,
                    child: Text('без разряда', style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                  ),
                  for (final rank in AthleteRank.values)
                    DropdownMenuItem<AthleteRank?>(
                      value: rank,
                      child: Text(rank.label, style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary)),
                    ),
                ],
                onChanged: (rank) => _setRank(context, athlete, rank),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _DisciplinesTab extends StatelessWidget {
  const _DisciplinesTab();

  Future<void> _rename(BuildContext context, Discipline discipline) async {
    final controller = TextEditingController(text: discipline.name);
    final name = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Дисциплина ${discipline.code}'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Новое название'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Отмена', style: TextStyle(color: AppTheme.textTertiary)),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(controller.text),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.textPrimary,
              foregroundColor: AppTheme.background,
            ),
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );
    if (name == null || !context.mounted) return;
    final admin = context.read<AdminController>();
    final problem = disciplineError(name: name);
    if (problem != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(problem)));
      return;
    }
    final updated = await admin.renameDiscipline(
      code: discipline.code,
      name: name,
    );
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          updated == null ? admin.error ?? 'Не вышло' : 'Название обновлено',
        ),
      ),
    );
  }

  Future<void> _create(BuildContext context) async {
    final code = TextEditingController();
    final name = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Новая дисциплина'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: code,
              decoration: const InputDecoration(
                labelText: 'Код (латиницей, например uav_racing)',
                helperText: 'строчные буквы, цифры и _; код потом не изменить',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: name,
              decoration: const InputDecoration(labelText: 'Название'),
            ),
          ],
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
    );
    final codeText = code.text;
    final nameText = name.text;
    code.dispose();
    name.dispose();
    if (!(saved ?? false)) return;
    if (!context.mounted) return;
    final admin = context.read<AdminController>();
    final problem = disciplineError(code: codeText.trim(), name: nameText);
    if (problem != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(problem)));
      return;
    }
    final created = await admin.addDiscipline(code: codeText, name: nameText);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          created == null ? admin.error ?? 'Не вышло' : 'Дисциплина добавлена',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final disciplines = context.watch<AdminController>().disciplines;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
      children: [
        for (final discipline in disciplines)
          Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        discipline.name,
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        discipline.code,
                        style: const TextStyle(fontSize: 12, color: AppTheme.textTertiary),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Переименовать',
                  icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.textSecondary),
                  onPressed: () => _rename(context, discipline),
                ),
              ],
            ),
          ),
        const SizedBox(height: 16),
        AppButton(
          text: 'Добавить дисциплину',
          icon: Icons.add_rounded,
          color: AppTheme.surfaceElevated,
          textColor: AppTheme.textPrimary,
          onPressed: () => _create(context),
        ),
      ],
    );
  }
}
