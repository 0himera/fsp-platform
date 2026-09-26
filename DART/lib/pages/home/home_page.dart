library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/auth/auth.dart';
import '../../shared/ui/ui.dart';
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
    await context.read<AuthController>().logout();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final organizer = auth.isOrganizer;

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

    final index = _tab < pages.length ? _tab : 0;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        titleSpacing: 20,
        title: Row(
          children: [
            Text(
              organizer ? 'Панель Федерации' : 'Федерация СП',
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.3,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
              decoration: BoxDecoration(
                color: AppTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppTheme.border),
              ),
              child: Text(
                organizer ? 'ОРГ' : 'АТЛЕТ',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                  color: AppTheme.textSecondary,
                ),
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: IconButton(
              tooltip: 'Выйти',
              onPressed: _logout,
              icon: const Icon(Icons.logout_rounded, size: 20, color: AppTheme.textSecondary),
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTheme.border, height: 1),
        ),
      ),
      body: IndexedStack(index: index, children: pages),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0F1116),
          border: Border(top: BorderSide(color: AppTheme.border, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: index,
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppTheme.textPrimary,
          unselectedItemColor: AppTheme.textTertiary,
          onTap: (value) => setState(() => _tab = value),
          items: [
            for (final label in labels)
              BottomNavigationBarItem(
                icon: Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: Icon(_iconOf(label), size: 21),
                ),
                activeIcon: Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceElevated,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.borderLight),
                    ),
                    child: Icon(_iconOf(label), size: 21, color: AppTheme.textPrimary),
                  ),
                ),
                label: label,
              ),
          ],
        ),
      ),
    );
  }

  IconData _iconOf(String label) => switch (label) {
    'Мои заявки' => Icons.assignment_turned_in_outlined,
    'Турниры' => Icons.emoji_events_outlined,
    'Рейтинг' => Icons.leaderboard_outlined,
    'Админка' => Icons.admin_panel_settings_outlined,
    _ => Icons.person_outline_rounded,
  };
}
