/// Заглушка «пусто» — один виджет на все списки приложения.
///
/// Держим её в `shared/ui`, а не пишем каждый раз `Center(Text(...))`: пустой
/// экран обязан объяснять, ЧТО делать дальше («выберите турнир»), а не молчать,
/// и формулировки должны быть одинаковыми во всём приложении.
library;

import 'package:flutter/material.dart';

class EmptyNotice extends StatelessWidget {
  const EmptyNotice({super.key, required this.text, this.icon});

  final String text;

  /// Иконка необязательная: в диалоге она не нужна, в списке уместна.
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 40,
                color: Theme.of(context).colorScheme.outline,
              ),
              const SizedBox(height: 12),
            ],
            Text(
              text,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}
