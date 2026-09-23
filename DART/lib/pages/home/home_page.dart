/// Главный экран: нижняя навигация по разделам (п.1–5 ТЗ в одном месте).
///
/// СОСТАВ ВКЛАДОК ЗАВИСИТ ОТ РОЛИ. Спортсмену нужны «заявки / соревнования /
/// рейтинг / кабинет»; организатору — «соревнования / рейтинг / админка /
/// кабинет». Ролей две, и сервер различает их честно (403 на админских
/// эндпоинтах), поэтому показ лишних кнопок — просто мусор в интерфейсе, а не
/// защита.
///
/// `IndexedStack` держит все вкладки в дереве: переключение вкладки не
/// сбрасывает введённый в поиск текст и не дёргает сеть заново.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/auth/auth.dart';
import '../admin/admin.dart';
import '../competitions/competitions.dart';
import '../profile/profile.dart';
import '../rating/rating.dart';
import '../registration/registration.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _tab = 0;

  Future<void> _logout() async {
    // Выход без подтверждения раздражает меньше, чем диалог «вы уверены?»
    // каждый раз, поэтому просто зовём logout: AuthGate сам вернёт на форму.
    await context.read<AuthController>().logout();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final organizer = auth.isOrganizer;

    // Набор вкладок разный для двух ролей — проще прочитать два списка
    // целиком, чем выводить их из условных вставок.
    final List<Widget> pages;
    final List<String> labels;
    if (organizer) {
      pages = const [
        CompetitionsPage(),
        RatingPage(),
        AdminPage(),
        ProfilePage(),
      ];
      labels = const ['Турниры', 'Рейтинг', 'Админка', 'Кабинет'];
    } else {
      pages = const [
        MyRegistrationsPage(),
        CompetitionsPage(),
        RatingPage(),
        ProfilePage(),
      ];
      labels = const ['Мои заявки', 'Турниры', 'Рейтинг', 'Кабинет'];
    }

    // Индекс мог остаться от другой роли (вход организатором после спортсмена
    // без перезапуска приложения), поэтому проверяем границу.
    final index = _tab < pages.length ? _tab : 0;

    return Scaffold(
      appBar: AppBar(
        title: Text(organizer ? 'Панель Федерации' : 'Федерация СП'),
        actions: [
          IconButton(
            tooltip: 'Выйти',
            onPressed: _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: IndexedStack(index: index, children: pages),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index,
        // Мобильная навигация по умолчанию показывает иконки; подписей в
        // четыре-пять вкладок достаточно, а типы иконок обязаны быть парными.
        type: BottomNavigationBarType.fixed,
        onTap: (value) => setState(() => _tab = value),
        items: [
          for (final label in labels)
            BottomNavigationBarItem(icon: Icon(_iconOf(label)), label: label),
        ],
      ),
    );
  }

  IconData _iconOf(String label) => switch (label) {
    'Мои заявки' => Icons.playlist_add_check,
    'Турниры' => Icons.emoji_events,
    'Рейтинг' => Icons.leaderboard,
    'Админка' => Icons.admin_panel_settings,
    // 'Кабинет'
    _ => Icons.person,
  };
}
