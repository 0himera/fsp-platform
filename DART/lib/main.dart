/// ТОЧКА СБОРКИ приложения (слой `app`).
///
/// Здесь единственный раз решается, КТО стоит за контрактами, и ответ один:
/// реальный бэкенд из `test-server/fsp-platform`. Приложения «с демо-данными»
/// не существует в принципе — контроллеры и страницы видят только абстрактные
/// сервисы из `entities`, а за ними всегда HTTP.
///
/// АДРЕС СЕРВЕРА: `--dart-define=API_BASE_URL=http://хост:порт` (по умолчанию
/// `http://127.0.0.1:8080`, см. `shared/api/api_config.dart`). Приложение
/// пересобирается при смене адреса, а не перезапускается: `const`-параметры
/// зашиваются в код сборки.
///
/// ПОЧЕМУ БЭКЕНД ОБЯЗАТЕЛЕН: авторизация сервера — это HttpOnly-cookie
/// `arena_session`, у клиента нет ни токена, ни запасного состояния, чтобы
/// работать без него. Подмена сервисов есть, но живёт она в `test/support/`
/// и в сборку приложения не попадает.
///
/// Второй вопрос, который решается здесь, — ПУСКАТЬ ИЛИ НЕ ПУСКАТЬ: `AuthGate`
/// ниже показывает заставку, экран входа или главный экран. Навигацией владеет
/// верхний уровень, а не сама форма входа: иначе «выход» не вернул бы
/// пользователя на форму, потому что экран входа уже был вытеснен из стека.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'entities/athlete/athlete.dart';
import 'entities/competition/competition.dart';
import 'entities/discipline/discipline.dart';
import 'entities/registration/registration.dart';
import 'features/admin/admin.dart';
import 'features/auth/auth.dart';
import 'features/competitions/competitions.dart';
import 'features/rating/rating.dart';
import 'features/registration/registration.dart';
import 'features/results/results.dart';
import 'pages/auth/auth.dart';
import 'pages/home/home.dart';
import 'shared/api/api.dart';

void main() => runApp(FpsApp(services: AppServices.http()));

/// Все реализации контрактов в одном месте.
///
/// Зачем отдельный класс, а не пять глобальных переменных: сервисы связаны
/// одним `ApiClient` (в нём живёт cookie-сессия), и их нельзя создавать
/// поодиночке — два клиента потеряли бы авторизацию после входа.
///
/// Конструктор открытый и принимает КОНТРАКТЫ: так тесты могут подставить свою
/// связку (`test/support/mock/`), не меняя ни строки в приложении.
class AppServices {
  AppServices({
    required this.auth,
    required this.athletes,
    required this.competitions,
    required this.registrations,
    required this.disciplines,
  });

  /// Боевой набор: один транспорт, одно cookie-хранилище, пять сервисов поверх.
  factory AppServices.http() {
    final api = ApiClient();
    return AppServices(
      auth: AuthHttpService(api),
      athletes: AthleteHttpService(api),
      competitions: CompetitionHttpService(api),
      registrations: RegistrationHttpService(api),
      disciplines: DisciplineHttpService(api),
    );
  }

  final AuthService auth;
  final AthleteService athletes;
  final CompetitionService competitions;
  final RegistrationService registrations;
  final DisciplineService disciplines;
}

class FpsApp extends StatelessWidget {
  const FpsApp({super.key, required this.services});

  final AppServices services;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      // Все контроллеры живут над HomePage: любой экран достаёт любой
      // контроллер через context.read/watch, и состояние переключается
      // между вкладками, а не создаётся заново на каждой.
      providers: [
        ChangeNotifierProvider<AuthController>(
          create: (_) =>
              AuthController(auth: services.auth, athletes: services.athletes),
        ),
        ChangeNotifierProvider<CompetitionsController>(
          create: (_) => CompetitionsController(
            competitions: services.competitions,
            disciplines: services.disciplines,
          ),
        ),
        // Карточка турнира — отдельный контроллер: её данные живут страницу, а
        // не всё приложение, и перечитывать их после заявки/протокола нужно
        // именно там, где они показаны.
        ChangeNotifierProvider<CompetitionDetailsController>(
          create: (_) => CompetitionDetailsController(
            competitions: services.competitions,
            registrations: services.registrations,
          ),
        ),
        ChangeNotifierProvider<RegistrationController>(
          create: (_) =>
              RegistrationController(registrations: services.registrations),
        ),
        ChangeNotifierProvider<ResultsController>(
          create: (_) => ResultsController(competitions: services.competitions),
        ),
        ChangeNotifierProvider<RatingController>(
          create: (_) => RatingController(athletes: services.athletes),
        ),
        ChangeNotifierProvider<AdminController>(
          create: (_) => AdminController(
            competitions: services.competitions,
            athletes: services.athletes,
            disciplines: services.disciplines,
          ),
        ),
      ],
      child: MaterialApp(
        title: 'Федерация спортивного программирования',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
          useMaterial3: true,
        ),
        home: const AuthGate(),
      ),
    );
  }
}

/// Пускаем дальше только когда понятно, кто в приложении.
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  @override
  void initState() {
    super.initState();
    // Спрашиваем сервер про сессию ОДИН раз при старте: `arena_session` —
    // HttpOnly-cookie, и извести о ней клиенту негде, кроме как в `/api/me`.
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<AuthController>().restore(),
    );
  }

  @override
  Widget build(BuildContext context) {
    // watch, а не read: это виджет-переключатель, и он обязан перерисоваться
    // в момент, когда login()/logout() вызывают notifyListeners().
    final auth = context.watch<AuthController>();
    if (!auth.restored) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return auth.isLoggedIn ? const HomePage() : const LoginPage();
  }
}
