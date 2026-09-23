/// Кабинет организатора (п.5 ТЗ): турниры, разряды, справочник дисциплин.
///
/// Три вкладки — три группы управляемых данных. Списки намеренно берутся из
/// уже существующих контроллеров: турниры отдаёт `CompetitionsController`
/// (организатор видит в нём и черновики), разряды и справочник —
/// `AdminController`. Дублировать состояние ради удобства вёрстки значило бы
/// однажды показать организатору устаревшую таблицу.
///
/// Прав доступа здесь нет: сервер сам ответит 403 «Недостаточно прав» на
/// любой админский вызов от спортсмена.
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
      // Список турниров для вкладки «Турниры» живёт в другом контроллере —
      // организатору нужны и черновики, которые сервер отдаёт только ему.
      final competitions = context.read<CompetitionsController>();
      if (competitions.items.isEmpty) competitions.load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        body: Column(
          children: [
            const TabBar(
              tabs: [
                Tab(text: 'Турниры'),
                Tab(text: 'Разряды'),
                Tab(text: 'Дисциплины'),
              ],
            ),
            const _ErrorBar(),
            Expanded(
              child: TabBarView(
                children: [
                  _CompetitionsTab(),
                  const _RanksTab(),
                  const _DisciplinesTab(),
                ],
              ),
            ),
          ],
        ),
        floatingActionButton: Builder(
          builder: (context) => FloatingActionButton(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CompetitionFormPage()),
            ),
            tooltip: 'Новый турнир',
            child: const Icon(Icons.add),
          ),
        ),
      ),
    );
  }
}

/// Строка ошибки текущей вкладки. Показываем текстом сервера: он объясняет
/// отказ по-русски, и «Недостаточно прав» полезнее, чем «что-то пошло не так».
class _ErrorBar extends StatelessWidget {
  const _ErrorBar();

  @override
  Widget build(BuildContext context) {
    final error = context.watch<AdminController>().error;
    if (error == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Text(
        error,
        style: TextStyle(color: Theme.of(context).colorScheme.error),
      ),
    );
  }
}

class _CompetitionsTab extends StatelessWidget {
  const _CompetitionsTab();

  @override
  Widget build(BuildContext context) {
    final competitions = context.watch<CompetitionsController>().items;
    if (competitions.isEmpty) {
      return const EmptyNotice(
        text: 'Турниров нет. Создайте первый кнопкой снизу.',
        icon: Icons.emoji_events_outlined,
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: competitions.length,
      itemBuilder: (context, index) {
        final competition = competitions[index];
        return CompetitionTile(
          competition: competition,
          trailing: IconButton(
            tooltip: 'Править',
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => CompetitionFormPage(competition: competition),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Разряды спортсменов (п.5 ТЗ: «присвоение разрядов»).
///
/// Список — тот же, что у рейтинга: `/api/rankings` отдаёт анкету вместе с
/// очками, и второго запроса за «просто анкетами» нет.
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
              : '${updated.fullName}: ${updated.rank?.label ?? 'разряд снят'}',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminController>();
    if (admin.athletes.isEmpty) {
      return const EmptyNotice(text: 'Спортсменов пока нет');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: admin.athletes.length,
      itemBuilder: (context, index) {
        final athlete = admin.athletes[index];
        return ListTile(
          title: Text(athlete.fullName),
          subtitle: Text('рейтинг ${athlete.rating}'),
          trailing: DropdownButton<AthleteRank?>(
            value: athlete.rank,
            hint: const Text('—'),
            // null = «без разряда»: сервер понимает это как снятие разряда.
            items: [
              const DropdownMenuItem<AthleteRank?>(
                value: null,
                child: Text('без разряда'),
              ),
              for (final rank in AthleteRank.values)
                DropdownMenuItem<AthleteRank?>(
                  value: rank,
                  child: Text(rank.label),
                ),
            ],
            onChanged: (rank) => _setRank(context, athlete, rank),
          ),
        );
      },
    );
  }
}

/// Справочник дисциплин: добавление и переименование.
///
/// Переименование меняет ТОЛЬКО название: код — идентификатор, на который
/// ссылаются турниры и анкеты, поэтому сервер и не позволяет его править.
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
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(controller.text),
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );
    if (name == null || !context.mounted) return;
    final admin = context.read<AdminController>();
    // Правила сервера (`disciplines.go`: название 3..120 байт) проверяем до
    // запроса: отказ сервера выглядит как «Некорректные или несвязанные
    // данные», и догадаться, какое именно поле виновато, по нему невозможно.
    final problem = disciplineError(name: name);
    if (problem != null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(problem)));
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
            TextField(
              controller: name,
              decoration: const InputDecoration(labelText: 'Название'),
            ),
          ],
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
    );
    final codeText = code.text;
    final nameText = name.text;
    code.dispose();
    name.dispose();
    if (!(saved ?? false)) return;
    // Текст полей прочитан и контроллеры закрыты ДО этой строки: дальше нужен
    // живой `context`, а страница за время диалога могла закрыться.
    if (!context.mounted) return;
    final admin = context.read<AdminController>();
    // Код проверяем по обрезанному значению — ровно потому, что обрезается он
    // и в `DisciplineHttpService.create`.
    final problem = disciplineError(code: codeText.trim(), name: nameText);
    if (problem != null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(problem)));
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
      padding: const EdgeInsets.all(12),
      children: [
        for (final discipline in disciplines)
          ListTile(
            dense: true,
            title: Text(discipline.name),
            subtitle: Text(discipline.code),
            trailing: IconButton(
              tooltip: 'Переименовать',
              icon: const Icon(Icons.drive_file_rename_outline),
              onPressed: () => _rename(context, discipline),
            ),
          ),
        const SizedBox(height: 8),
        AppButton(
          text: 'Добавить дисциплину',
          onPressed: () => _create(context),
        ),
      ],
    );
  }
}
