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
      backgroundColor: AppTheme.surfaceElevated,
      color: AppTheme.textPrimary,
      onRefresh: controller.load,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: TextField(
              controller: _search,
              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Поиск по названию турнира...',
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
              onSubmitted: controller.search,
            ),
          ),
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: [
                _chip(label: 'Все', value: null, controller: controller),
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
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.error.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded, size: 18, color: AppTheme.error),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      controller.error!,
                      style: const TextStyle(color: AppTheme.error, fontSize: 13),
                    ),
                  ),
                  TextButton(
                    onPressed: controller.load,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: Size.zero,
                    ),
                    child: const Text('Повторить', style: TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
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
          Expanded(
            child: controller.items.isEmpty && !controller.isLoading
                ? const EmptyNotice(
                    text: 'Турниров по этому фильтру нет',
                    icon: Icons.emoji_events_outlined,
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
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
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () => controller.filterStatus(selected ? null : value),
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
              fontSize: 12.5,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              color: selected ? AppTheme.background : AppTheme.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}
