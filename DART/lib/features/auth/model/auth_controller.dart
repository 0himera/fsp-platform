/// Контроллер входа и личного кабинета — слой `features/auth/model`.
///
/// Здесь ЛОГИКА и СОСТОЯНИЕ фичи, ни одного виджета: экран читает поля и дёргает
/// методы, а `notifyListeners()` сообщает ему, что данные изменились.
///
/// КАК МЫ УЗНАЁМ, «КТО СЕЙЧАС В СИСТЕМЕ». Бэкенд авторизует по cookie
/// `arena_session`, поэтому у клиента нет своего токена, который можно было бы
/// сохранить и считать «мы вошли». Единственный источник правды — ответ
/// `GET /api/me`. Отсюда `restore()` при запуске: приложение могли открыть
/// через сутки после входа, и честный способ узнать, жива ли сессия, — спросить
/// сервер.
///
/// СЕРВИСЫ ПРИНОСЯТ ИЗВНЕ (см. main.dart): фича не выбирает реализацию сама. В
/// приложении за контрактами всегда HTTP-бэкенд, подмена возможна только в
/// тестах — и контроллеру всё равно, кто отвечает на `login()`.
library;

import 'package:flutter/foundation.dart';

import '../../../entities/athlete/athlete.dart';
import '../../../shared/utils/utils.dart';

class AuthController extends ChangeNotifier {
  // `this._auth` вместо `auth` + `_auth = auth` — то же самое в две строки
  // меньше; на месте вызова параметр называется по имени поля без подчёркивания:
  // `AuthController(auth: ..., athletes: ...)`.
  AuthController({required this._auth, required this._athletes});

  final AuthService _auth;
  final AthleteService _athletes;

  /// Ответ `GET /api/me` целиком. Держим одной структурой, а не двумя полями
  /// «user» и «athlete»: сервер отдаёт их неразрывно, и разъехаться у них не
  /// должно быть шанса. `null` — не входили (или сессия истекла).
  CurrentSession? session;

  /// Идёт ли запрос. UI показывает спиннер и блокирует кнопку, чтобы второй
  /// тап не устроил гонку двух ответов.
  bool isLoading = false;

  /// Текст ошибки или null. Нужен, чтобы экран показал «не удалось войти»
  /// вместо вечной крутилки.
  String? error;

  AuthUser? get user => session?.user;

  /// Анкета спортсмена с рейтингом. У организатора её нет — это норма, а не
  /// ошибка загрузки.
  Athlete? get athlete => session?.athlete;

  bool get isLoggedIn => session != null;
  bool get isOrganizer => session?.isOrganizer ?? false;

  /// Проверка сессии на старте уже закончена (успешно или нет). Пока она
  /// `false`, показываем заставку, а не экран входа: иначе при живой cookie
  /// пользователь видел бы «войдите» и лишнюю секунду паники.
  bool restored = false;

  /// Проверка сессии на старте.
  ///
  /// Отличается от входа тем, что ОТСУТСТВИЕ пользователя — это норма: cookie
  /// могла истечь за сутки, и тогда честно показываем форму входа, а не текст
  /// ошибки «Войдите в аккаунт».
  Future<void> restore() async {
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      session = await _athletes.me().timeout(const Duration(milliseconds: 1500));
    } on Object catch (_) {
      session = null;
    } finally {
      restored = true;
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login({required String email, required String password}) =>
      _signIn(() => _auth.login(email: email, password: password));

  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    String organization = '',
    String city = '',
  }) => _signIn(
    () => _auth.register(
      email: email,
      password: password,
      fullName: fullName,
      organization: organization,
      city: city,
    ),
  );

  /// Общий хвост входа и регистрации: сервер в обоих случаях заводит сессию и
  /// отвечает `user`, но рейтинга и дисциплин там нет — их добираем через
  /// `/api/me`, чтобы кабинет сразу показывал то же, что и после перезапуска.
  Future<bool> _signIn(Future<AuthUser> Function() request) => _run(() async {
    // Ответ login/register нам не нужен: он содержит только `user`, а полный
    // пакет («кто я + анкета + рейтинг») даёт /api/me.
    await request();
    session = await _athletes.me();
  });

  /// Выход. Ошибку не показываем намеренно: сервер мог уже потерять сессию, а
  /// клиент обязан «разойтись» с ней в любом случае — иначе пользователь
  /// застрял бы в кабинете, из которого не может выйти.
  Future<void> logout() async {
    try {
      await _auth.logout();
    } on Exception catch (_) {
      // молчим осознанно
    }
    session = null;
    error = null;
    isLoading = false;
    notifyListeners();
  }

  /// Правка анкеты (п.1 ТЗ). Сервер после сохранения возвращает тот же пакет,
  /// что и `/api/me`, поэтому перечитывать профиль вторым запросом не нужно.
  Future<bool> updateProfile(AthleteProfileUpdate update) => _run(() async {
    session = await _athletes.updateProfile(update);
  });

  /// Единственная обёртка над «ждём → изменили → сообщили».
  ///
  /// `notifyListeners()` вызывается дважды: до запроса (иначе спиннер не
  /// появится — код ниже уходит в await и продолжится через секунду) и после
  /// (иначе экран останется со старыми данными).
  Future<bool> _run(Future<void> Function() action) async {
    if (isLoading) return false;
    isLoading = true;
    error = null;
    notifyListeners();
    var ok = true;
    try {
      await action();
    } on Exception catch (e) {
      // Ловим Exception, а не всё подряд: Error — это баг в коде, его глушить
      // нельзя, он должен остаться в консоли.
      error = failureMessage(e);
      ok = false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
    return ok;
  }
}
