/// Проверка HTTP-слоя: что именно уходит на сервер и как читаются его ответы.
///
/// Сеть в тестах подменяется (`MockClient` из `package:http/testing.dart`), но
/// проверяется не «наш вымысел», а контракт бэкенда:
///  • путь и метод — по таблице маршрутов `httpapi/server.go`;
///  • ключи тела — сервер раскодирует строго (`DisallowUnknownFields`), лишний
///    ключ означает 400, поэтому набор ключей сверяется буквально;
///  • cookie `arena_session` — на ней держится вся авторизация;
///  • `Origin` не отправляется — иначе сервер посчитает запрос межсайтовым (403).
library;

import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:fps_app/entities/athlete/athlete.dart';
import 'package:fps_app/entities/competition/competition.dart';
import 'package:fps_app/entities/discipline/discipline.dart';
import 'package:fps_app/entities/registration/registration.dart';
import 'package:fps_app/shared/api/api.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

/// Ключи, которые принимает `competitions.Input` (backend/internal/competitions/
/// service.go). Сверяем МНОЖЕСТВО, а не «какие-то поля есть»: именно лишний
/// ключ — самый частый способ получить 400 от этого сервера.
const Set<String> _competitionInputKeys = {
  'title',
  'level_code',
  'discipline_code',
  'format',
  'starts_at',
  'ends_at',
  'registration_deadline',
  'location',
  'description',
  'status',
  'stage',
  'qualifying_competition_id',
  'qualifying_place_limit',
};

void main() {
  group('сессия', () {
    test(
      'login забирает токен из Set-Cookie и подставляет его в следующий раз',
      () async {
        final stub = Stub({
          'POST /api/auth/login': _json(
            {
              'user': {
                'id': 1,
                'email': 'a@b.c',
                'role': 'athlete',
                'full_name': 'Амина',
              },
            },
            // Ровно так отдаёт сервер: `http.SetCookie(..., Path=/, HttpOnly,
            // SameSite=Lax, MaxAge=30 дней)`.
            headers: {
              'set-cookie': 'arena_session=tk-abc; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000',
            },
          ),
          'GET /api/me': _json({
            'user': {'id': 1, 'email': 'a@b.c', 'role': 'athlete'},
            'athlete': {'id': 2, 'full_name': 'Амина'},
          }),
        });

        final user = await AuthHttpService(stub.api)
            .login(email: ' a@b.c ', password: 'x');
        expect(user.email, 'a@b.c');
        expect(user.fullName, 'Амина');
        expect(stub.api.session.token, 'tk-abc');

        // Второй сервис — тот же ApiClient (как в `main.dart`), и он уже авторизован.
        final session = await AthleteHttpService(stub.api).me();
        expect(stub.last.headers['cookie'], 'arena_session=tk-abc');
        expect(session.athlete?.fullName, 'Амина');
      },
    );

    test(
      'logout: пустое значение cookie с Max-Age=-1 очищает сессию',
      () async {
        final stub = Stub({
          'POST /api/auth/logout': _json(
            {'ok': true},
            headers: {
              'set-cookie': 'arena_session=; Path=/; Max-Age=-1; HttpOnly',
            },
          ),
        });
        stub.api.session.use('tk-abc');

        await AuthHttpService(stub.api).logout();

        expect(stub.api.session.hasSession, isFalse);
      },
    );

    test('межсайтовой запрос не устраиваем: заголовка Origin нет', () async {
      final stub = Stub({'GET /api/disciplines': _json(<Object>[])});
      await DisciplineHttpService(stub.api).list();

      expect(stub.last.headers.containsKey('origin'), isFalse);
      expect(stub.last.headers['accept'], 'application/json');
      // Content-type сервер ждёт только у запросов с телом (иначе 400).
      expect(stub.last.headers.containsKey('content-type'), isFalse);
    });
  });

  group('ошибки сервера', () {
    test(
      '401: текст сервера, признак «не авторизован» и очистка сессии',
      () async {
        final stub = Stub({
          'GET /api/me': _json({'error': 'Войдите в аккаунт'}, status: 401),
        });
        stub.api.session.use('tk-stale');

        final failure = await _capture(() => AthleteHttpService(stub.api).me());
        expect(failure.statusCode, 401);
        expect(failure.isUnauthorized, isTrue);
        expect(failure.message, 'Войдите в аккаунт');
        expect(stub.api.session.hasSession, isFalse);
      },
    );

    test(
      '409 при заявке в закрытый приём сохраняет формулировку сервера',
      () async {
        final stub = Stub({
          'POST /api/competitions/8/register': _json({
            'error': 'Регистрация закрыта или действие недоступно',
          }, status: 409),
        });

        final failure = await _capture(
          () => RegistrationHttpService(stub.api).register('8'),
        );
        expect(failure.statusCode, 409);
        expect(failure.message, 'Регистрация закрыта или действие недоступно');
      },
    );

    test('403 от финала без прохождения отбора читается как есть', () async {
      final stub = Stub({
        'POST /api/competitions/9/register': _json({
          'error': 'В финал проходят только участники отбора в пределах проходного места',
        }, status: 403),
      });

      final failure = await _capture(
        () => RegistrationHttpService(stub.api).register('9'),
      );
      expect(failure.isForbidden, isTrue);
      expect(failure.message, startsWith('В финал проходят'));
    });

    test('ответ не-JSON (прокси, статика) не роняет разбор', () async {
      final stub = Stub({'GET /api/me': http.Response('<html>', 502)});

      final failure = await _capture(() => AthleteHttpService(stub.api).me());
      expect(failure.message, contains('502'));
    });

    test('200 без тела — пустой объект, а не ошибка разбора', () async {
      final stub = Stub({
        'POST /api/competitions/8/register': http.Response('', 200),
      });

      await RegistrationHttpService(stub.api).register('8');
      expect(stub.requests, hasLength(1));
    });

    test('сервер не отвечает: внятное сообщение вместо падения разбора', () async {
      // Здесь подстава НЕ используется: порт 1 заведомо закрыт, и мы проверяем
      // превращение сетевого отказа в `ApiFailure`.
      final api = ApiClient(
        config: const ApiConfig(baseUrl: 'http://127.0.0.1:1'),
      );
      final failure = await _capture(() => AthleteHttpService(api).me());
      expect(failure.statusCode, 0);
      expect(failure.message, contains('Соединение с сервером не установлено'));
    });
  });

  group('адресация', () {
    test('фильтры списка уезжают параметрами status и q', () async {
      final stub = Stub({'GET /api/competitions': _json(<Object>[])});
      await CompetitionHttpService(stub.api)
          .list(status: CompetitionStatus.open, query: '  кубок ');

      final query = stub.last.url.queryParameters;
      expect(query['status'], 'open');
      expect(query['q'], 'кубок');
    });

    test('пустые фильтры не отравляют адрес', () async {
      final stub = Stub({'GET /api/competitions': _json(<Object>[])});
      await CompetitionHttpService(stub.api).list();

      expect(stub.last.url.path, '/api/competitions');
      expect(stub.last.url.query, isEmpty);
    });

    test(
      'вложенные ресурсы: отмена заявки, удаление команды, разряд',
      () async {
        final stub = Stub({'*': _json(<String, dynamic>{})});
        final competitions = CompetitionHttpService(stub.api);
        final athletes = AthleteHttpService(stub.api);
        final registrations = RegistrationHttpService(stub.api);

        await registrations.cancel('8');
        expect(stub.last.method, 'DELETE');
        expect(stub.last.url.path, '/api/competitions/8/register');

        await competitions.deleteTeam(competitionId: '8', teamId: '3');
        expect(stub.last.method, 'DELETE');
        expect(stub.last.url.path, '/api/competitions/8/teams/3');

        await athletes.setRank('2', null);
        expect(stub.last.method, 'PATCH');
        expect(stub.last.url.path, '/api/athletes/2/rank');
      },
    );
  });

  group('тела запросов: ровно те ключи, что принимает сервер', () {
    test('создание турнира — набор полей competitions.Input', () async {
      final stub = Stub({'POST /api/competitions': _json(<String, dynamic>{})});
      await CompetitionHttpService(stub.api).create(
        CompetitionDraft(
          title: '  Кубок ДГУ  ',
          level: CompetitionLevel.regional,
          disciplineCode: 'algorithmic',
          format: CompetitionFormat.individual,
          startsAt: DateTime(2026, 10, 5, 10),
          endsAt: DateTime(2026, 10, 5, 16),
          registrationDeadline: DateTime(2026, 10, 4, 23),
          status: CompetitionStatus.open,
        ),
      );

      expect(stub.lastBody.keys.toSet(), _competitionInputKeys);
      // Обрезка пробелов на стороне клиента: сервер делает то же самое, но
      // валидацию длины проходит уже trimmed-значение.
      expect(stub.lastBody['title'], 'Кубок ДГУ');
      expect(stub.lastBody['level_code'], 'regional');
      expect(stub.lastBody['status'], 'open');
      expect(stub.lastBody['stage'], 'standalone');
      expect(stub.lastBody['qualifying_competition_id'], isNull);
      // Даты: Go разбирает `time.Time` только по RFC 3339 С отметкой зоны.
      // Локальный `toIso8601String()` зоны не имеет — живой сервер на таком
      // ответит 400, поэтому проверяем и суффикс зоны, и что момент не уехал.
      final sent = stub.lastBody['starts_at'] as String;
      expect(sent, matches(RegExp(r'(Z|[+-]\d{2}:\d{2})$')));
      expect(DateTime.parse(sent).toUtc(), DateTime(2026, 10, 5, 10).toUtc());
    });

    test('финал: id отбора уходит ЧИСЛОМ, а не строкой', () async {
      final stub = Stub({'POST /api/competitions': _json(<String, dynamic>{})});
      await CompetitionHttpService(stub.api).create(
        CompetitionDraft(
          title: 'Финал кубка',
          level: CompetitionLevel.rdChampionship,
          disciplineCode: 'algorithmic',
          format: CompetitionFormat.individual,
          startsAt: DateTime(2026, 10, 10),
          endsAt: DateTime(2026, 10, 10, 12),
          registrationDeadline: DateTime(2026, 10, 9),
          status: CompetitionStatus.open,
          stage: CompetitionStage.finalStage,
          qualifyingCompetitionId: '17',
          qualifyingPlaceLimit: 8,
        ),
      );

      expect(stub.lastBody.keys.toSet(), _competitionInputKeys);
      expect(stub.lastBody['stage'], 'final');
      expect(stub.lastBody['qualifying_competition_id'], 17);
      expect(stub.lastBody['qualifying_place_limit'], 8);
    });

    test('правка анкеты — четыре ключа без рейтинга и id', () async {
      final stub = Stub({'PATCH /api/me': _json(<String, dynamic>{})});
      await AthleteHttpService(stub.api).updateProfile(
        const AthleteProfileUpdate(
          fullName: '  Амина Алиева ',
          organization: 'ДГУ',
          city: 'Махачкала',
          disciplineCodes: ['algorithmic', 'uav'],
        ),
      );

      expect(stub.lastBody, {
        'full_name': 'Амина Алиева',
        'organization': 'ДГУ',
        'city': 'Махачкала',
        'disciplines': ['algorithmic', 'uav'],
      });
    });

    test('разряд: снятие отправляется кодом none', () async {
      final stub = Stub({
        'PATCH /api/athletes/2/rank': _json(<String, dynamic>{}),
      });
      final athletes = AthleteHttpService(stub.api);

      await athletes.setRank('2', null);
      expect(stub.lastBody, {'rank_code': 'none'});

      await athletes.setRank('2', AthleteRank.master);
      expect(stub.lastBody, {'rank_code': 'MS'});
    });

    test(
      'протокол: тело {results:[{athlete_id, place, score_text}]}',
      () async {
        final stub = Stub({
          'PUT /api/competitions/8/results': _json(<String, dynamic>{}),
        });
        await CompetitionHttpService(stub.api).publishProtocol(
          competitionId: '8',
          protocol: const [
            ProtocolEntry(athleteId: '18', place: 1, scoreText: ' 6 задач '),
            ProtocolEntry(teamId: '24', place: 2, scoreText: '5 задач'),
          ],
        );

        expect(stub.lastBody.keys, ['results']);
        expect(stub.lastBody['results'], [
          // `id` и `name` не отправляем: их сервер вычисляет сам.
          {'athlete_id': 18, 'place': 1, 'score_text': '6 задач'},
          // Командная строка несёт уже team_id — как в таблице results.
          {'team_id': 24, 'place': 2, 'score_text': '5 задач'},
        ]);
      },
    );

    test('команда: состав уходит массивом чисел member_ids', () async {
      final stub = Stub({
        'POST /api/competitions/9/teams': _json(<String, dynamic>{}),
      });
      await CompetitionHttpService(stub.api).createTeam(
        competitionId: '9',
        name: '  Сборная ДГУ ',
        memberAthleteIds: ['18', '24'],
      );

      expect(stub.lastBody, {
        'name': 'Сборная ДГУ',
        'member_ids': [18, 24],
      });
    });

    test(
      'регистрация: письмо и оповещение — пять ключей auth-эндпоинта',
      () async {
        // Сервер отвечает 201 и сразу выдаёт сессионную cookie: пользователь
        // попадёт в кабинет без повторного входа.
        final stub = Stub({
          'POST /api/auth/register': _json(
            {
              'user': {
                'id': 7,
                'email': 'new@arena.local',
                'role': 'athlete',
                'full_name': 'Новый Спортсмен',
              },
            },
            status: 201,
            headers: {
              'set-cookie':
                  'arena_session=tk-new; Path=/; HttpOnly; SameSite=Lax',
            },
          ),
        });
        final user = await AuthHttpService(stub.api).register(
          email: ' new@arena.local ',
          password: 'secret-pass',
          fullName: ' Новый Спортсмен ',
          organization: 'ДГУ',
          city: '',
        );

        expect(stub.lastBody, {
          'email': 'new@arena.local',
          'password': 'secret-pass',
          'full_name': 'Новый Спортсмен',
          'organization': 'ДГУ',
          'city': '',
        });
        expect(user.email, 'new@arena.local');
        expect(stub.api.session.token, 'tk-new');
      },
    );

    test('дисциплины: создание по коду и переименование по пути', () async {
      final stub = Stub({
        'POST /api/disciplines': _json(<String, dynamic>{}),
        'PUT /api/disciplines/uav': _json(<String, dynamic>{}),
      });
      final service = DisciplineHttpService(stub.api);

      await service.create(code: ' uav ', name: '  БПЛА  ');
      expect(stub.lastBody, {'code': 'uav', 'name': 'БПЛА'});

      await service.rename(code: 'uav', name: 'Беспилотники');
      expect(stub.last.url.path, '/api/disciplines/uav');
      expect(stub.lastBody, {'name': 'Беспилотники'});
    });
  });
}

/// Ответ сервера в том виде, в каком его отдаёт Go: JSON, код, заголовки.
http.Response _json(
  Object body, {
  int status = 200,
  Map<String, String>? headers,
}) => http.Response(
  jsonEncode(body),
  status,
  headers: {'content-type': 'application/json', ...?headers},
);

Future<ApiFailure> _capture(Future<Object?> Function() request) async {
  try {
    await request();
  } on ApiFailure catch (failure) {
    return failure;
  }
  throw StateError('ожидали ApiFailure, а запрос прошёл успешно');
}

/// Подстава вместо сети: помнит запросы и отвечает по таблице маршрутов.
///
/// Ключ таблицы — «МЕТОД ПУТЬ» (как в `mux.HandleFunc` на сервере), `*` — ответ
/// по умолчанию. Наружу отдаём [api]: один `ApiClient` на все сервисы, потому
/// что именно так он собран в `main.dart` — сессия живёт в нём.
class Stub {
  factory Stub(Map<String, http.Response> routes) {
    final requests = <http.Request>[];
    // Подстава живёт внутри `ApiClient`: так тест проверяет и транспорт, и
    // разбор ответа, и заголовки, которые клиент подставил сам.
    final client = MockClient((request) async {
      requests.add(request);
      final key = '${request.method} ${request.url.path}';
      final response = routes[key] ?? routes['*'];
      if (response == null) {
        // `Error`, а не исключение контракта: тест обязан упасть с именем
        // маршрута, а не получить «красивую» ошибку ApiFailure.
        throw StateError('Маршрут $key не описан в тесте');
      }
      return response;
    });
    return Stub._(
      requests: requests,
      api: ApiClient(
        config: const ApiConfig(baseUrl: 'http://backend.test'),
        client: client,
      ),
    );
  }

  Stub._({required this.requests, required this.api});

  final List<http.Request> requests;
  final ApiClient api;

  http.Request get last => requests.last;

  /// Тело последнего запроса, разобранное как JSON.
  Map<String, dynamic> get lastBody =>
      jsonDecode(last.body) as Map<String, dynamic>;
}
