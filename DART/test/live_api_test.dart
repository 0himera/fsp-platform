/// Живая проверка против запущенного бэкенда из `test-server/fsp-platform`.
///
/// По умолчанию файл ПРОПУСКАЕТСЯ: `flutter test` не должен зависеть от того,
/// поднят ли Docker. Включение:
/// ```bash
/// docker compose -f test-server/fsp-platform/docker-compose.yml up -d
/// flutter test --dart-define=API_LIVE=true test/live_api_test.dart
/// ```
/// Адрес берётся из `API_BASE_URL` (по умолчанию `http://127.0.0.1:8080`),
/// доступы — из `LIVE_ATHLETE_*` / `LIVE_ORGANIZER_*` (значения по умолчанию
/// совпадают с демосидом из README сервера).
///
/// ЗАЧЕМ ЭТО НУЖНО, ЕСЛИ ЕСТЬ МОКИ И ФИКСТУРЫ: только живой сервер решает,
/// какие поля он принимает, какой ответ считает валидным и каким текстом
/// объясняет отказ. Здесь проверяется именно разговор с живым HTTP:
/// разбор реальных ответов, cookie-сессия между двумя запросами и сверка
/// формулы рейтинга с числами, которые посчитала база.
///
/// ДАННЫЕ СЕРВЕРА МЫ НЕ МЕНЯЕМ. Записи проверяются только там, где запрос
/// заведомо отклоняется до записи в БД (400/403/404/409): иначе дымовой прогон
/// оставил бы мусор в демонстрационной базе, а удалить его нечем — API удаления
/// турниров и протоколов не имеет.
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:fps_app/entities/athlete/athlete.dart';
import 'package:fps_app/entities/athlete_result/athlete_result.dart';
import 'package:fps_app/entities/competition/competition.dart';
import 'package:fps_app/entities/discipline/discipline.dart';
import 'package:fps_app/entities/rating/rating.dart';
import 'package:fps_app/entities/registration/registration.dart';
import 'package:fps_app/shared/api/api.dart';

const bool live = bool.fromEnvironment('API_LIVE');

const String _athleteEmail = String.fromEnvironment(
  'LIVE_ATHLETE_EMAIL',
  defaultValue: 'athlete1@arena.local',
);
const String _athletePassword = String.fromEnvironment(
  'LIVE_ATHLETE_PASSWORD',
  defaultValue: 'demo-athlete-2026',
);
const String _organizerEmail = String.fromEnvironment(
  'LIVE_ORGANIZER_EMAIL',
  defaultValue: 'organizer@arena.local',
);
const String _organizerPassword = String.fromEnvironment(
  'LIVE_ORGANIZER_PASSWORD',
  defaultValue: 'change-me-for-local-demo',
);

/// `false` — проверка идёт; строка — пропуск с этой причиной. Пустая строка
/// не годится: `skip` воспринимает ЛЮБУЮ строку как «пропустить».
final Object _skip = live
    ? false
    : 'Нужен запущенный бэкенд и --dart-define=API_LIVE=true';

/// Новый клиент на тест: сессия не должна перетекать из одного теста в другой,
/// иначе «незалогиненные» проверки внезапно оказывались бы залогиненными.
ApiClient _api() => ApiClient();

void main() {
  group('живой бэкенд', () {
    test('health объявляет ту же версию правил, что считает клиент', () async {
      final health = await _api().get('/api/health') as Map<String, dynamic>;
      expect(health['status'], 'ok');
      // Расхождение здесь означает, что рейтинг в UI и в базе посчитан
      // разными правилами, — это самый дорогой из «тихих» багов.
      expect(health['rating_rules'], RatingCalculator.rulesVersion);
    }, skip: _skip);

    test('справочник дисциплин читается без авторизации', () async {
      final disciplines = await DisciplineHttpService(_api()).list();
      expect(disciplines.map((d) => d.code), contains('algorithmic'));
      expect(disciplines.every((d) => d.name.isNotEmpty), isTrue);
    }, skip: _skip);

    test(
      'вход спортсмена: cookie держит сессию на всех последующих запросах',
      () async {
        final api = _api();
        final user = await AuthHttpService(api)
            .login(email: ' $_athleteEmail ', password: _athletePassword);
        expect(user.role, AccountRole.athlete);
        expect(api.session.hasSession, isTrue);

        final session = await AthleteHttpService(api).me();
        expect(session.user.id, user.id);
        expect(session.athlete, isNotNull);
        expect(session.isOrganizer, isFalse);
      },
      skip: _skip,
    );

    test(
      'кабинет: рейтинг сходится из частей и совпадает с расчётом клиента',
      () async {
        final session = await _me();
        final athlete = session.athlete!;

        // Сервер отдаёт уже готовые суммы; проверяем, что они собраны по той же
        // схеме, что и у нас: 4 лучших + бонус разряда, помноженный на активность.
        final included = athlete.results.where((r) => r.included).toList();
        expect(included.length, lessThanOrEqualTo(RatingCalculator.bestCount));
        expect(
          athlete.resultPoints,
          RatingCalculator.round(
            included.fold<double>(0, (sum, r) => sum + r.points),
          ),
        );
        expect(
          athlete.rankPoints,
          RatingCalculator.round(athlete.rankBase * athlete.activityFactor),
        );

        // И главное — пересчёт всей истории нашей копией формулы.
        final ours = RatingCalculator.calculate(
          profile: athlete,
          rows: [for (final r in athlete.results) _rowOf(r)],
          asOf: DateTime.now().toUtc(),
        );
        expect(ours.rankBase, athlete.rankBase);
        expect(ours.resultPoints, closeTo(athlete.resultPoints, 0.01));
        expect(ours.rankPoints, closeTo(athlete.rankPoints, 0.01));
      },
      skip: _skip,
    );

    test('таблица рейтинга: порядок мест и разделение равных сумм', () async {
      final page = await AthleteHttpService(_api()).rankings();
      expect(page.athletes, isNotEmpty);
      expect(page.asOf.isAfter(DateTime(2020)), isTrue);

      final places = page.athletes.map((a) => a.ratingPlace).toList();
      expect(places.first, 1, reason: 'таблица отсортирована, первый — первый');
      for (var i = 1; i < places.length; i++) {
        expect(
          places[i],
          greaterThanOrEqualTo(places[i - 1]),
          reason: 'места не убывают вниз по списку',
        );
        // Равная сумма обязана давать равное место — иначе клиент нарисует
        // «разных» лидеров там, где сервер посчитал ничью.
        if (page.athletes[i].rating == page.athletes[i - 1].rating) {
          expect(places[i], places[i - 1]);
        }
      }
    }, skip: _skip);

    test(
      'список и карточка турнира: фильтр по статусу работает на сервере',
      () async {
        final competitions = await CompetitionHttpService(_api())
            .list(status: CompetitionStatus.open);
        expect(
          competitions,
          isNotEmpty,
          reason: 'в демосиде есть открытые старты',
        );
        expect(
          competitions.every((c) => c.status == CompetitionStatus.open),
          isTrue,
          reason: 'сервер отфильтровал по статусу, а не мы после него',
        );

        final detail = await CompetitionHttpService(_api())
            .detail(competitions.first.id);
        expect(detail.competition.id, competitions.first.id);
        expect(
          detail.registrations,
          hasLength(detail.competition.registrationsCount),
        );
      },
      skip: _skip,
    );

    test('поиск по названию уходит параметром `q` и находит сид', () async {
      final found = await CompetitionHttpService(_api())
          .list(query: _seedTitleFragment);
      expect(found, isNotEmpty);
      expect(
        found.every(
          (c) =>
              c.title.toLowerCase().contains(_seedTitleFragment.toLowerCase()),
        ),
        isTrue,
        // Сервер: `c.title ILIKE '%' || $2 || '%'` — регистронезависимо и только
        // по названию, поэтому сравниваем в нижнем регистре.
        reason: 'поиск идёт по подстроке названия',
      );
    }, skip: _skip);

    test('несуществующий турнир — 404 с русским текстом сервера', () async {
      // id заведомо свободный: сид сервера занимает первые сотни записей.
      final failure = await _capture(
        () => CompetitionHttpService(_api()).detail('999999999'),
      );
      expect(failure.statusCode, 404);
      expect(failure.message, 'Не найдено');
    }, skip: _skip);

    test('спортсмен не организатор: админские вызовы — 403', () async {
      final api = _api();
      await AuthHttpService(api)
          .login(email: _athleteEmail, password: _athletePassword);

      final forbidden = await _capture(
        () =>
            DisciplineHttpService(api)
                .create(code: 'smoke_test', name: 'Проверка'),
      );
      expect(forbidden.statusCode, 403);
      expect(forbidden.message, 'Недостаточно прав');
      expect(forbidden.isForbidden, isTrue);
    }, skip: _skip);

    test('короткое название отклоняет САМ СЕРВЕР: 400 «Проверьте…»', () async {
      // До запроса наша форма такой черновик не отдаёт (`validationError`, см.
      // competition_status_test.dart), поэтому тело отправляется напрямую через
      // ApiClient. Важно обратное: сервер держит то же правило сам, и обойти
      // его клиентской проверкой нельзя — в БД не попадает ничего кривое.
      //
      // Заголовок латиницей и ровно два знака: `validInput` меряет название в
      // БАЙТАХ (`len()`), поэтому `ab` — это 2 байта и отказ, а вот `аб` — уже
      // 4 байта, и сервер его принимает. Кириллицей короткое название не
      // проверяется: такой запрос создал бы лишнюю запись в демобазе.
      final api = await _organizerApi();
      final failure = await _capture(
        () => api.post('/api/competitions', body: _draftBody(title: 'ab')),
      );
      expect(failure.statusCode, 400);
      expect(failure.message, contains('Проверьте'));
    }, skip: _skip);

    test(
      '160-байтный потолок сервер считает по байтам, а не по символам',
      () async {
        // 81 русская буква — это 162 байта: по-человечески «меньше 160
        // символов», но Go `len()` видит 162 и отказывает. Именно поэтому
        // клиентские валидаторы меряют utf8Length, а не String.length.
        final api = await _organizerApi();
        final failure = await _capture(
          () =>
              api.post('/api/competitions', body: _draftBody(title: 'а' * 81)),
        );
        expect(failure.statusCode, 400);
        expect(failure.message, contains('Проверьте'));
      },
      skip: _skip,
    );

    test(
      'наши даты сервер разбирает: отказ приходит ПОСЛЕ декодирования',
      () async {
        // Ключевая проверка пути записи: `starts_at` без отметки зоны сервер не
        // смог бы раскодовать, и вместо правила мы бы получили текст про
        // `cannot parse`. Здесь черновик по датам корректен, но ссылается на
        // несуществующий отбор — отказ приходит уже на валидации связки, значит
        // даты сервер прочитал. В БД при этом ничего не появляется.
        final api = await _organizerApi();
        final failure = await _capture(
          () => api.post(
            '/api/competitions',
            body: {
              ..._draftBody(),
              'stage': 'final',
              'qualifying_competition_id': 999999999,
              'qualifying_place_limit': 8,
            },
          ),
        );
        expect(failure.statusCode, 400);
        expect(failure.message, 'Проверьте данные соревнования и протокола');
      },
      skip: _skip,
    );

    test('лишнее поле в теле — 400: сервер раскодирует строго', () async {
      // Ровно то, ради чего `Competition` и `CompetitionDraft` — разные модели:
      // read-модель с `id` и счётчиками в POST не положить.
      final api = await _organizerApi();
      final failure = await _capture(
        () => api.post(
          '/api/competitions',
          body: _draftBody(extra: {'registrations_count': 0}),
        ),
      );
      expect(failure.statusCode, 400);
    }, skip: _skip);

    test(
      'заявка в завершённый турнир — 409, и текст объясняет отказ',
      () async {
        final closed = (await CompetitionHttpService(
          _api(),
        ).list(status: CompetitionStatus.completed)).first;

        final api = _api();
        await AuthHttpService(api)
            .login(email: _athleteEmail, password: _athletePassword);
        final failure = await _capture(
          () => RegistrationHttpService(api).register(closed.id),
        );
        expect(failure.statusCode, 409);
        expect(failure.message, 'Регистрация закрыта или действие недоступно');
      },
      skip: _skip,
    );

    test('выход: cookie снимается, следующий /api/me — 401', () async {
      final api = _api();
      await AuthHttpService(api)
          .login(email: _athleteEmail, password: _athletePassword);
      await AuthHttpService(api).logout();
      expect(api.session.hasSession, isFalse);

      final failure = await _capture(() => AthleteHttpService(api).me());
      expect(failure.statusCode, 401);
      expect(failure.isUnauthorized, isTrue);
      expect(failure.message, 'Войдите в аккаунт');
    }, skip: _skip);

    test('неверный пароль — 401 без создания сессии', () async {
      final api = _api();
      final failure = await _capture(
        () => AuthHttpService(api)
            .login(email: _athleteEmail, password: '$_athletePassword-не-тот'),
      );
      expect(failure.statusCode, 401);
      expect(failure.message, 'Неверная почта или пароль');
      expect(api.session.hasSession, isFalse);
    }, skip: _skip);
  });
}

/// Фрагмент названия из демосида (`backend/internal/demo`), чтобы поиск имел
/// что находить на любой копии базы.
const String _seedTitleFragment = 'Кубок';

Future<CurrentSession> _me() async {
  final api = _api();
  await AuthHttpService(api)
      .login(email: _athleteEmail, password: _athletePassword);
  return AthleteHttpService(api).me();
}

Future<ApiClient> _organizerApi() async {
  final api = _api();
  await AuthHttpService(api)
      .login(email: _organizerEmail, password: _organizerPassword);
  return api;
}

/// Черновик турнира телом `competitions.Input`. Статус `draft` выбран не из
/// жалости к данным: такой турнир не виден спортсменам, а запрос всё равно
/// проходит всю серверную валидацию — и отклоняется до записи в БД.
Map<String, dynamic> _draftBody({String? title, Map<String, dynamic>? extra}) =>
    {
      ...CompetitionDraft(
        title: title ?? 'Черновик для дымового теста',
        level: CompetitionLevel.regional,
        disciplineCode: 'algorithmic',
        format: CompetitionFormat.individual,
        startsAt: DateTime.now().add(const Duration(days: 30)),
        endsAt: DateTime.now().add(const Duration(days: 31)),
        registrationDeadline: DateTime.now().add(const Duration(days: 29)),
        status: CompetitionStatus.draft,
      ).toJson(),
      ...?extra,
    };

Future<ApiFailure> _capture(Future<Object?> Function() request) async {
  try {
    await request();
  } on ApiFailure catch (failure) {
    return failure;
  }
  return fail('Сервер должен был отклонить запрос, но ответил успех');
}

/// Строка истории обратно во вход формулы — как в `fixtures_test.dart`.
RatingRow _rowOf(AthleteResult result) => RatingRow(
  competitionId: result.competitionId,
  competitionTitle: result.competitionTitle,
  disciplineCode: result.disciplineCode,
  level: result.level,
  stage: result.stage,
  endsAt: result.endsAt,
  place: result.place,
  finishers: result.finishers,
);
