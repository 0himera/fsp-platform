// Material даёт нам Widget, BuildContext, ElevatedButton, Color и Text.
import 'package:flutter/material.dart';

/// Кнопка приложения — базовый UI-примитив слоя `shared`.
///
/// Проще не сделать: принимает текст, цвет и действие. Вся логика —
/// «отдать Flutter то, что попросили». Нужна она в одном месте, потому что
/// радиус и высота тогда будут одинаковыми у всех кнопок в приложении.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.color,
  });

  /// Надпись на кнопке.
  final String text;

  /// Функция, которая выполнится по нажатию. Если передашь `null`,
  /// ElevatedButton сам затемнит кнопку и сделает её некликабельной.
  final VoidCallback? onPressed;

  /// Цвет фона. Необязательный: тогда берём основной цвет темы,
  /// и кнопка автоматически подстраивается под тёмную/светлую тему.
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        // Если цвет не задан — берём цвет темы (оператор ?? = «или»).
        backgroundColor: color ?? Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white, // текст всегда белый
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(
            12,
          ), // единый скруг для всех кнопок
        ),
        minimumSize: const Size(0, 48), // минимум по высоте — удобно пальцем
      ),
      child: Text(text),
    );
  }
}
