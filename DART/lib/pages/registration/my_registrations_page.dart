/// Экран «мои заявки» (п.2 ТЗ).
///
/// Сервер отдаёт этот список одним запросом `GET /api/me/registrations` —
/// карточки те же, что и в общем списке турниров, поэтому здесь нет склейки
/// «заявка + соревнование» на клиенте.
///
/// Откуда кнопка «отозвать»: сервер разрешает отзыв, только пока приём открыт,
/// срок не истёк и спортсмен не включён в команду. Мы это не перепроверяем
/// (данных о командах в списке нет) — показываем кнопку и отдаём текст ответа,
/// если сервер откажет.
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
    // Читаем список при открытии вкладки: данные могли измениться на другом
    // экране (заявка подана из карточки турнира).
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<RegistrationController>().load(),
    );
  }

  Future<void> _cancel(Competition competition) async {
    final controller = context.read<RegistrationController>();
    final done = await controller.cancel(competition.id);
    if (!mounted) return;
    // Контроллер уже перечитал список, поэтому здесь только текст исхода:
    // «отказ» без причины выглядел бы как сломанная кнопка.
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          done ? 'Заявка отозвана' : controller.error ?? 'Не вышло',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<RegistrationController>();

    if (controller.isLoading && controller.mine.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (controller.mine.isEmpty) {
      return const EmptyNotice(
        text: 'Заявок пока нет. Выберите турнир во вкладке «Турниры».',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: controller.mine.length,
      itemBuilder: (context, index) {
        final competition = controller.mine[index];
        return CompetitionTile(
          competition: competition,
          // Отзыв возможен только пока приём открыт — кнопку «на всякий
          // случай» лучше спрятать, чем вести к отказу.
          trailing: competition.isRegistrationOpen(DateTime.now())
              ? IconButton(
                  tooltip: 'Отозвать заявку',
                  onPressed: () => _cancel(competition),
                  icon: const Icon(Icons.delete_outline),
                )
              : null,
        );
      },
    );
  }
}
