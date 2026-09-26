library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../entities/competition/competition.dart';
import '../../features/registration/registration.dart';
import '../../shared/ui/ui.dart';
import '../competitions/competitions.dart';

class MyRegistrationsPage extends StatefulWidget {
  const MyRegistrationsPage({super.key});

  @override
  State<MyRegistrationsPage> createState() => _MyRegistrationsPageState();
}

class _MyRegistrationsPageState extends State<MyRegistrationsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<RegistrationController>().load(),
    );
  }

  Future<void> _cancel(Competition competition) async {
    final controller = context.read<RegistrationController>();
    final done = await controller.cancel(competition.id);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          done ? 'Заявка отозвана' : controller.error ?? 'Не вышло',
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
    final controller = context.watch<RegistrationController>();

    if (controller.isLoading && controller.mine.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation(AppTheme.textPrimary),
        ),
      );
    }
    if (controller.mine.isEmpty) {
      return const EmptyNotice(
        text: 'Заявок пока нет. Выберите турнир во вкладке «Турниры».',
        icon: Icons.assignment_outlined,
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      itemCount: controller.mine.length,
      itemBuilder: (context, index) {
        final competition = controller.mine[index];
        return CompetitionTile(
          competition: competition,
          trailing: competition.isRegistrationOpen(DateTime.now())
              ? Container(
                  decoration: BoxDecoration(
                    color: AppTheme.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: IconButton(
                    tooltip: 'Отозвать заявку',
                    onPressed: () => _cancel(competition),
                    icon: const Icon(Icons.close_rounded, size: 18, color: AppTheme.error),
                  ),
                )
              : null,
        );
      },
    );
  }
}
