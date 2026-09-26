library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../entities/competition/competition.dart';
import '../../features/competitions/competitions.dart';
import '../../shared/ui/ui.dart';
import '../../shared/utils/utils.dart';
import 'competitions.dart';

class CompetitionTile extends StatelessWidget {
  const CompetitionTile({
    super.key,
    required this.competition,
    this.trailing,
    this.openOnTap = true,
  });

  final Competition competition;
  final Widget? trailing;
  final bool openOnTap;

  @override
  Widget build(BuildContext context) {
    final discipline = context.watch<CompetitionsController>().disciplineName(
      competition.disciplineCode,
    );
    final now = DateTime.now();
    final isRegClosed = competition.status == CompetitionStatus.open && !competition.isRegistrationOpen(now);

    final (statusBg, statusFg) = switch (competition.status) {
      CompetitionStatus.open => isRegClosed 
          ? (AppTheme.error.withValues(alpha: 0.12), AppTheme.error)
          : (AppTheme.success.withValues(alpha: 0.12), AppTheme.success),
      CompetitionStatus.running => (AppTheme.warning.withValues(alpha: 0.12), AppTheme.warning),
      CompetitionStatus.completed => (AppTheme.surfaceElevated, AppTheme.textTertiary),
      _ => (AppTheme.surfaceElevated, AppTheme.textTertiary),
    };

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 5),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: openOnTap
              ? () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CompetitionDetailsPage(competitionId: competition.id),
                    ),
                  )
              : null,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.tagBg,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppTheme.borderLight),
                      ),
                      child: Text(
                        discipline.isEmpty ? competition.disciplineCode : discipline,
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.2,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${competition.level.label} · ${competition.format.label} зачёт',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: AppTheme.textTertiary,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusBg,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        competition.status.label,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          color: statusFg,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  competition.title,
                  style: const TextStyle(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                    color: AppTheme.textPrimary,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textTertiary),
                    const SizedBox(width: 4),
                    Text(
                      competition.location.isEmpty ? 'Место не указано' : competition.location,
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                    const SizedBox(width: 14),
                    const Icon(Icons.calendar_today_outlined, size: 13, color: AppTheme.textTertiary),
                    const SizedBox(width: 4),
                    Text(
                      formatDate(competition.startsAt),
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Wrap(
                      spacing: 8,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF101217),
                            borderRadius: BorderRadius.circular(5),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Text(
                            'заявок: ${competition.registrationsCount}',
                            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                          ),
                        ),
                        if (competition.resultsCount > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF101217),
                              borderRadius: BorderRadius.circular(5),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Text(
                              'протокол: ${competition.resultsCount}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ),
                        if (competition.isGatedFinal)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF101217),
                              borderRadius: BorderRadius.circular(5),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Text(
                              'финал: проход ${competition.qualifyingPlaceLimit ?? "?"}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.warning),
                            ),
                          ),
                      ],
                    ),
                    if (trailing != null)
                      trailing!
                    else if (openOnTap)
                      const Icon(Icons.chevron_right_rounded, size: 20, color: AppTheme.textTertiary),
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
