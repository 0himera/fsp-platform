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
    final codes = <String>{
      for (final athlete in controller.athletes) ...athlete.disciplineCodes,
    }.toList()..sort();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: TextField(
            controller: _search,
            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Поиск по ФИО, организации или городу...',
              prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppTheme.textTertiary),
              suffixIcon: _search.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, size: 18, color: AppTheme.textTertiary),
                      onPressed: () {
                        _search.clear();
                        controller.search('');
                      },
                    )
                  : null,
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
            onChanged: controller.search,
          ),
        ),
        if (codes.isNotEmpty)
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: [
                _chip(label: 'Все дисциплины', selected: controller.disciplineCode == null, onSelected: () => controller.filterDiscipline(null)),
                for (final code in codes)
                  _chip(
                    label: disciplines.disciplineName(code),
                    selected: controller.disciplineCode == code,
                    onSelected: () => controller.filterDiscipline(code),
                  ),
              ],
            ),
          ),
        if (controller.isLoading)
          const LinearProgressIndicator(
            minHeight: 2,
            backgroundColor: AppTheme.border,
            valueColor: AlwaysStoppedAnimation(AppTheme.textPrimary),
          ),
        if (controller.error != null)
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.error.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.error.withValues(alpha: 0.3)),
            ),
            child: Text(
              controller.error!,
              style: const TextStyle(color: AppTheme.error, fontSize: 13),
            ),
          ),
        Expanded(
          child: controller.visible.isEmpty && !controller.isLoading
              ? const EmptyNotice(
                  text: 'Никого не найдено. Попробуйте снять фильтр.',
                  icon: Icons.person_search_outlined,
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
                  itemCount: controller.visible.length,
                  itemBuilder: (context, index) {
                    final athlete = controller.visible[index];
                    return _AthleteRatingCard(
                      athlete: athlete,
                      onTap: () => _explain(athlete),
                    );
                  },
                ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: AppTheme.border)),
          ),
          child: Text(
            _footnote(controller),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary),
          ),
        ),
      ],
    );
  }

  Widget _chip({
    required String label,
    required bool selected,
    required VoidCallback onSelected,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onSelected,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: selected ? AppTheme.textPrimary : AppTheme.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? AppTheme.textPrimary : AppTheme.border,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              color: selected ? AppTheme.background : AppTheme.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  String _footnote(RatingController controller) {
    final asOf = controller.asOf;
    final rules = controller.rulesVersion;
    final parts = <String>[
      if (asOf != null) 'Расчёт на ${formatDateTime(asOf)}',
      if (rules.isNotEmpty) 'правила $rules',
    ];
    return parts.isEmpty ? 'Федеральный рейтинг' : parts.join(' · ');
  }

  Future<void> _explain(Athlete athlete) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (_) => DraggableScrollableSheet(
      initialChildSize: 0.65,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      expand: false,
      builder: (_, scrollController) => Padding(
        padding: const EdgeInsets.all(20),
        child: ListView(
          controller: scrollController,
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
            const SizedBox(height: 18),
            Row(
              children: [
                _PlaceBadge(place: athlete.ratingPlace),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        athlete.fullName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.3,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${athlete.organization.isEmpty ? "Организация не указана" : athlete.organization} · ${athlete.rank?.label ?? "Без разряда"}',
                        style: const TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
                Text(
                  '${athlete.rating}',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF101217),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.border),
              ),
              child: Text(
                RatingController.explain(athlete),
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.45),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Зачётные старты (${athlete.results.length})',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            for (final result in athlete.results)
              Container(
                margin: const EdgeInsets.symmetric(vertical: 4),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceElevated,
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: Text(
                        '${result.place}',
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppTheme.textPrimary),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            result.competitionTitle,
                            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${result.place} из ${result.finishers} · ${result.base} × ${result.placeFactor} × ${result.sizeFactor} × ${result.decay}',
                            style: const TextStyle(fontSize: 11, color: AppTheme.textTertiary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '+${result.points}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    ),
  );
}

class _AthleteRatingCard extends StatelessWidget {
  const _AthleteRatingCard({required this.athlete, required this.onTap});

  final Athlete athlete;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                _PlaceBadge(place: athlete.ratingPlace),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        athlete.fullName,
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -0.2,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${athlete.organization.isEmpty ? "Организация не указана" : athlete.organization}'
                        ' · ${athlete.rank?.label ?? "Без разряда"}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${athlete.rating}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const Text(
                      'очков',
                      style: TextStyle(
                        fontSize: 10,
                        color: AppTheme.textTertiary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PlaceBadge extends StatelessWidget {
  const _PlaceBadge({required this.place});

  final int place;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (place) {
      1 => (const Color(0xFFF59E0B).withValues(alpha: 0.18), const Color(0xFFFBBF24)),
      2 => (const Color(0xFF94A3B8).withValues(alpha: 0.2), const Color(0xFFE2E8F0)),
      3 => (const Color(0xFFB45309).withValues(alpha: 0.2), const Color(0xFFF59E0B)),
      _ => (AppTheme.surfaceElevated, AppTheme.textSecondary),
    };

    return Container(
      width: 34,
      height: 34,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: place <= 3 && place > 0 ? fg.withValues(alpha: 0.4) : AppTheme.border,
        ),
      ),
      child: Text(
        place > 0 ? '$place' : '—',
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}
