/// Личный кабинет спортсмена (п.1 ТЗ) и короткая страница организатора.
///
/// Кабинет показывает то, что посчитал СЕРВЕР: `GET /api/me` приносит анкету,
/// рейтинг и историю выступлений с разложением по коэффициентам. Здесь мы только
/// читаем и объясняем числа — пересчёт на клиенте дал бы вторую версию правды.
///
/// Правка доступна в рамках `PATCH /api/me`: ФИО, организация, город,
/// дисциплины. Разряд — не наша прерогатива: его назначает организатор
/// отдельным эндпоинтом, поэтому в форме его поля нет сознательно.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../entities/athlete/athlete.dart';
import '../../entities/athlete_result/athlete_result.dart';
import '../../features/auth/auth.dart';
import '../../features/competitions/competitions.dart';
import '../../features/rating/rating.dart';
import '../../shared/ui/ui.dart';
import '../../shared/utils/utils.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  @override
  void initState() {
    super.initState();
    // Справочник дисциплин нужен форме редактирования, а живёт он в
    // контроллере турниров. Заодно список турниров будет готов, когда
    // пользователь переключится на соседнюю вкладку.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final competitions = context.read<CompetitionsController>();
      if (competitions.disciplines.isEmpty) competitions.load();
    });
  }

  Future<void> _edit(Athlete athlete) async {
    final update = await showModalBottomSheet<AthleteProfileUpdate>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => _ProfileForm(athlete: athlete),
    );
    if (update == null || !mounted) return;
    final auth = context.read<AuthController>();
    final saved = await auth.updateProfile(update);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(saved ? 'Профиль обновлён' : auth.error ?? 'Не вышло'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user;
    final athlete = auth.athlete;

    if (user == null) {
      return const EmptyNotice(text: 'Сессия не найдена — войдите заново');
    }

    // Организатор: анкету спортсмена сервер не отдаёт, это не ошибка.
    if (athlete == null) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Организатор', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(user.email),
          const SizedBox(height: 24),
          const Text(
            'Учётная запись организатора не имеет спортивной анкеты: разряды, '
            'заявки и рейтинг относятся к спортсменам. Управление турнирами — '
            'во вкладке «Админка».',
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                athlete.fullName,
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            IconButton(
              tooltip: 'Править анкету',
              onPressed: () => _edit(athlete),
              icon: const Icon(Icons.edit_outlined),
            ),
          ],
        ),
        Text(user.email),
        const SizedBox(height: 8),
        Text(
          '${athlete.city.isEmpty ? 'Город не указан' : athlete.city}'
          ' · ${athlete.organization.isEmpty ? 'организация не указана' : athlete.organization}',
        ),
        Text('Разряд: ${athlete.rank?.label ?? 'не присвоен'}'),
        Text('Дисциплины: ${_disciplines(athlete.disciplineCodes)}'),
        const SizedBox(height: 16),
        _RatingCard(athlete: athlete),
        const SizedBox(height: 16),
        Text(
          'История выступлений (${athlete.results.length})',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        if (athlete.results.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: Text('Зачётных стартов пока нет.'),
          ),
        for (final result in athlete.results) _ResultTile(result: result),
      ],
    );
  }

  /// Человеческие названия дисциплин по их кодам.
  String _disciplines(List<String> codes) {
    if (codes.isEmpty) return 'не выбраны';
    final names = context.read<CompetitionsController>();
    return [for (final code in codes) names.disciplineName(code)].join(', ');
  }
}

/// Карточка рейтинга: место, сумма и ПОЛНОЕ разложение.
///
/// П.4 ТЗ требует не только посчитать, но и обосновать. Поэтому здесь лежат
/// и «четыре лучших», и бонус разряда с коэффициентом активности — спортсмен
/// может проверить любую строку руками.
class _RatingCard extends StatelessWidget {
  const _RatingCard({required this.athlete});

  final Athlete athlete;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${athlete.rating}',
                  style: Theme.of(context).textTheme.displaySmall,
                ),
                const SizedBox(width: 12),
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    athlete.ratingPlace > 0
                        ? '${athlete.ratingPlace}-е место в рейтинге'
                        : 'места в рейтинге нет',
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Text('Очки за старты: ${athlete.resultPoints}'),
            Text(
              'Бонус разряда: ${athlete.rankBase} × активность '
              '${athlete.activityFactor} = ${athlete.rankPoints}',
            ),
            const SizedBox(height: 8),
            Text(RatingController.explain(athlete)),
            if (athlete.rulesVersion.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Правила расчёта: ${athlete.rulesVersion}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Одна строка истории: старт, место, очки и «попал ли в четыре лучших».
class _ResultTile extends StatelessWidget {
  const _ResultTile({required this.result});

  final AthleteResult result;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        child: Text(
          result.included ? '${result.place}' : '${result.place}?',
          style: const TextStyle(fontSize: 12),
        ),
      ),
      title: Text(result.competitionTitle),
      subtitle: Text(
        '${result.level.label} · ${result.stage.label} · '
        '${result.place} из ${result.finishers} · ${formatDate(result.endsAt)}',
      ),
      // Точка с плавающей запятой в подписи — это очки, а не «номер строки»,
      // поэтому подпись развёрнута: 0 означает «не зачтено», и это надо
      // видеть сразу.
      trailing: Text(
        result.points > 0 ? '+${result.points}' : '—',
        style: Theme.of(context).textTheme.titleSmall,
      ),
    );
  }
}

/// Форма правки анкеты — `PATCH /api/me`.
class _ProfileForm extends StatefulWidget {
  const _ProfileForm({required this.athlete});

  final Athlete athlete;

  @override
  State<_ProfileForm> createState() => _ProfileFormState();
}

class _ProfileFormState extends State<_ProfileForm> {
  late final _fullName = TextEditingController(text: widget.athlete.fullName);
  late final _city = TextEditingController(text: widget.athlete.city);
  late final _organization = TextEditingController(
    text: widget.athlete.organization,
  );
  late final _codes = <String>{...widget.athlete.disciplineCodes};

  @override
  void dispose() {
    _fullName.dispose();
    _city.dispose();
    _organization.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final disciplines = context.watch<CompetitionsController>().disciplines;
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        // Клавиатура не должна перекрывать поля.
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Анкета спортсмена',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _fullName,
            decoration: const InputDecoration(labelText: 'ФИО'),
          ),
          TextField(
            controller: _city,
            decoration: const InputDecoration(labelText: 'Город'),
          ),
          TextField(
            controller: _organization,
            decoration: const InputDecoration(labelText: 'Учебная организация'),
          ),
          const SizedBox(height: 8),
          Text(
            'Дисциплины (не больше пяти — так проверяет сервер)',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final discipline in disciplines)
                  CheckboxListTile(
                    dense: true,
                    title: Text(discipline.name),
                    subtitle: Text(discipline.code),
                    value: _codes.contains(discipline.code),
                    onChanged: (checked) => setState(() {
                      if (checked ?? false) {
                        _codes.add(discipline.code);
                      } else {
                        _codes.remove(discipline.code);
                      }
                    }),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          AppButton(
            text: 'Сохранить',
            onPressed: () => Navigator.of(context).pop(
              AthleteProfileUpdate(
                fullName: _fullName.text,
                city: _city.text,
                organization: _organization.text,
                disciplineCodes: _codes.toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
