/// Сквозные проверки интерфейса на подменённых сервисах: вход → роль → вкладки → выход.
///
/// Почему моки, а не HTTP-заглушки: соответствие бэкенду уже проверяют
/// `http_api_test.dart` (адреса, тела, cookie, ошибки) и `fixtures_test.dart`
/// (разбор реальных ответов). Здесь предмет другой — слой `app` и `pages`:
///  • `AuthGate` не показывает главный экран до восстановления сессии и не
///    заставляет ждать форму входа впустую;
///  • набор вкладок соответствует роли, потому что сервер различает роли
///    честно (403 на админских вызовах);
///  • тексты ошибок доходят до пользователя дословно.
///
/// Каждый тест получает СВОЮ `MockDatabase.demo`: общая база доедала бы сессию
/// от предыдущего теста, и второй старт был бы уже «входом».
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fps_app/main.dart';
import 'package:fps_app/pages/home/home.dart';

import 'support/mock/mock.dart';

/// Подпись вкладки нижней навигации.
///
/// Искать просто по тексту нельзя: в админке есть свои вкладки «Турниры», и
/// проверка «вкладка видна» превратилась бы в проверку «слово есть где-то».
Finder tab(String label) => find.descendant(
  of: find.byType(BottomNavigationBar),
  matching: find.text(label),
);

Future<void> boot(WidgetTester tester) async {
  // Экран заведомо крупный: в дефолтных 800×600 часть колонок переполняется,
  // и тест падал бы на вёрстке, а не на проверяемом поведении.
  tester.view.physicalSize = const Size(1400, 2400);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  await tester.pumpWidget(
    FpsApp(services: mockAppServices(MockDatabase.demo())),
  );
  // `restore()` стартует в postFrame-колбэке, поэтому один кадр нужен: до него
  // на экране заставка, и это тоже проверяется ниже — но отдельно.
  await tester.pumpAndSettle();
}

Future<void> login(
  WidgetTester tester, {
  required String email,
  required String password,
}) async {
  await tester.enterText(
    find.widgetWithText(TextFormField, 'Электронная почта'),
    email,
  );
  await tester.enterText(
    find.widgetWithText(TextFormField, 'Пароль'),
    password,
  );
  await tester.tap(find.text('Войти'));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('пока сессия не восстановлена — заставка, потом форма входа', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1400, 2400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      FpsApp(services: mockAppServices(MockDatabase.demo())),
    );
    // Кадр до ответа «сервера»: пользователь не должен на мгновение увидеть
    // главный экран или форму входа — иначе при живом `me()` интерфейс мигает.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.byType(HomePage), findsNothing);

    await tester.pumpAndSettle();
    expect(find.text('Вход в платформу'), findsOneWidget);
    // Подсказка с демодоступами одинакова в mock- и HTTP-режиме.
    expect(find.textContaining('athlete1@arena.local'), findsOneWidget);
  });

  testWidgets('неверный пароль: текст сервера показан как есть', (
    tester,
  ) async {
    await boot(tester);
    await login(
      tester,
      email: 'athlete1@arena.local',
      password: 'wrong-password',
    );

    expect(
      find.text('Неверная почта или пароль'),
      findsOneWidget,
      reason: 'mock повторяет auth.ErrInvalidCredentials, а не выдумывает своё',
    );
    expect(find.byType(HomePage), findsNothing);
  });

  testWidgets('спортсмен: свои вкладки и никаких админских кнопок', (
    tester,
  ) async {
    await boot(tester);
    await login(
      tester,
      email: 'athlete1@arena.local',
      password: 'demo-athlete-2026',
    );

    expect(find.text('Федерация СП'), findsOneWidget);
    expect(tab('Мои заявки'), findsOneWidget);
    expect(tab('Админка'), findsNothing);

    // Кабинет: анкета берётся из `/api/me`, а не из ответа входа, поэтому
    // ФИО на этом экране — доказательство, что контроллер реально сходил за профиль.
    await tester.tap(tab('Кабинет'));
    await tester.pumpAndSettle();
    expect(find.text('Тагир Гулиев'), findsOneWidget);
  });

  testWidgets('организатор: админка есть, «Мои заявки» — нет', (tester) async {
    await boot(tester);
    await login(
      tester,
      email: 'organizer@arena.local',
      password: 'change-me-for-local-demo',
    );

    expect(find.text('Панель Федерации'), findsOneWidget);
    expect(tab('Мои заявки'), findsNothing);

    await tester.tap(tab('Админка'));
    await tester.pumpAndSettle();
    expect(find.byTooltip('Новый турнир'), findsOneWidget);
    // Список турниров в админке берётся из того же контроллера, что и у
    // спортсмена: организатор видит и черновики.
    expect(find.text('Первенство Дагестана по алгоритмам'), findsOneWidget);
  });

  testWidgets('переключение вкладки грузит список турниров', (tester) async {
    await boot(tester);
    await login(
      tester,
      email: 'athlete1@arena.local',
      password: 'demo-athlete-2026',
    );

    await tester.tap(tab('Турниры'));
    await tester.pumpAndSettle();
    expect(find.text('Первенство Дагестана по алгоритмам'), findsOneWidget);
  });

  testWidgets('выход возвращает на форму входа', (tester) async {
    await boot(tester);
    await login(
      tester,
      email: 'athlete1@arena.local',
      password: 'demo-athlete-2026',
    );
    expect(find.byType(HomePage), findsOneWidget);

    await tester.tap(find.byTooltip('Выйти'));
    await tester.pumpAndSettle();

    expect(find.text('Вход в платформу'), findsOneWidget);
    expect(find.byType(HomePage), findsNothing);
  });
}
