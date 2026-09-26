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

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user;

    if (user == null) {
      return const Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(AppTheme.textPrimary)));
    }

    final athlete = auth.athlete;

    return RefreshIndicator(
      backgroundColor: AppTheme.surfaceElevated,
      color: AppTheme.textPrimary,
      onRefresh: () => context.read<AuthController>().restore(),
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          _UserHeader(user: user, athlete: athlete),
          const SizedBox(height: 16),
          if (athlete != null) ...[
            _RatingCard(athlete: athlete),
            const SizedBox(height: 20),
            Text(
              'История выступлений (${athlete.results.length})',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.3,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            if (athlete.results.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: EmptyNotice(
                  text: 'Зачётных стартов пока нет',
                  icon: Icons.history_rounded,
                ),
              )
            else
              for (final result in athlete.results)
                _ResultCard(result: result),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
              ),
              child: const Text(
                'Профиль организатора турниров. Для управления турнирами используйте вкладку «Админка».',
                style: TextStyle(fontSize: 13.5, color: AppTheme.textSecondary, height: 1.45),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _UserHeader extends StatelessWidget {
  const _UserHeader({required this.user, required this.athlete});

  final AuthUser user;
  final Athlete? athlete;

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return 'СП';
    if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
    return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final name = athlete?.fullName.isNotEmpty == true ? athlete!.fullName : user.email;

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Text(
                  _initials(name),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      user.email,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: AppTheme.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.tagBg,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Text(
                  user.isOrganizer ? 'Организатор' : 'Спортсмен',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          if (athlete != null) ...[
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 14),
            _infoRow(Icons.military_tech_outlined, 'Разряд', athlete!.rank?.label ?? 'не присвоен'),
            _infoRow(Icons.school_outlined, 'Организация', athlete!.organization.isEmpty ? 'не указана' : athlete!.organization),
            _infoRow(Icons.location_city_outlined, 'Город', athlete!.city.isEmpty ? 'не указан' : athlete!.city),
            _infoRow(Icons.code_rounded, 'Дисциплины', _disciplines(context, athlete!.disciplineCodes)),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              height: 42,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.tune_rounded, size: 16),
                label: const Text('Редактировать анкету', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.textPrimary,
                  side: const BorderSide(color: AppTheme.borderLight),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(11)),
                ),
                onPressed: () => _edit(context, athlete!),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.5),
      child: Row(
        children: [
          Icon(icon, size: 15, color: AppTheme.textTertiary),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(fontSize: 12.5, color: AppTheme.textTertiary)),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  String _disciplines(BuildContext context, List<String> codes) {
    if (codes.isEmpty) return 'не выбраны';
    final names = context.read<CompetitionsController>();
    return [for (final code in codes) names.disciplineName(code)].join(', ');
  }

  Future<void> _edit(BuildContext context, Athlete athlete) async {
    final update = await showModalBottomSheet<AthleteProfileUpdate>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _ProfileForm(athlete: athlete),
    );
    if (update == null || !context.mounted) return;
    final done = await context.read<AuthController>().updateProfile(update);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(done ? 'Анкета обновлена' : 'Ошибка сохранения'),
        backgroundColor: AppTheme.surfaceElevated,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: AppTheme.border),
        ),
      ),
    );
  }
}

class _RatingCard extends StatelessWidget {
  const _RatingCard({required this.athlete});

  final Athlete athlete;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Рейтинг спортсмена',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textTertiary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${athlete.rating}',
                    style: const TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -1,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Text(
                  athlete.ratingPlace > 0
                      ? '${athlete.ratingPlace}-е место'
                      : 'вне рейтинга',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF101217),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('За турниры', style: TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                      const SizedBox(height: 2),
                      Text('${athlete.resultPoints}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                    ],
                  ),
                ),
                Container(width: 1, height: 26, color: AppTheme.border),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Бонус разряда', style: TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                      const SizedBox(height: 2),
                      Text('${athlete.rankPoints}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                    ],
                  ),
                ),
                Container(width: 1, height: 26, color: AppTheme.border),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Активность', style: TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                      const SizedBox(height: 2),
                      Text('${athlete.activityFactor}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            RatingController.explain(athlete),
            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4),
          ),
          if (athlete.rulesVersion.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Правила расчёта: ${athlete.rulesVersion}',
              style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary),
            ),
          ],
        ],
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.result});

  final AthleteResult result;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: result.included ? AppTheme.surfaceElevated : const Color(0xFF101217),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: result.included ? AppTheme.borderLight : AppTheme.border,
              ),
            ),
            child: Text(
              '${result.place}',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: result.included ? AppTheme.textPrimary : AppTheme.textTertiary,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  result.competitionTitle,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.2,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${result.level.label} · ${result.stage.label} · ${result.place} из ${result.finishers} · ${formatDate(result.endsAt)}',
                  style: const TextStyle(fontSize: 11.5, color: AppTheme.textTertiary),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(
            result.points > 0 ? '+${result.points}' : '—',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: result.points > 0 ? AppTheme.textPrimary : AppTheme.textTertiary,
            ),
          ),
        ],
      ),
    );
  }
}

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
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.borderLight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Анкета спортсмена',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.3,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _fullName,
            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
            decoration: const InputDecoration(labelText: 'ФИО'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _city,
            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
            decoration: const InputDecoration(labelText: 'Город'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _organization,
            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
            decoration: const InputDecoration(labelText: 'Учебная организация'),
          ),
          const SizedBox(height: 12),
          const Text(
            'Дисциплины (не более 5)',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textTertiary),
          ),
          const SizedBox(height: 6),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final discipline in disciplines)
                  CheckboxListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    activeColor: AppTheme.textPrimary,
                    checkColor: AppTheme.background,
                    title: Text(discipline.name, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13.5)),
                    subtitle: Text(discipline.code, style: const TextStyle(color: AppTheme.textTertiary, fontSize: 11.5)),
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
          const SizedBox(height: 16),
          AppButton(
            text: 'Сохранить изменения',
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
