/// Разбор РЕАЛЬНЫХ ответов сервера (фикстуры `test/fixtures/*.json`).
///
/// Это главный тест на «мы правильно работаем с бэкендом»: он проверяет не наш
/// выдуманный JSON, а снимки, снятые с запущенного `test-server/fsp-platform`.
/// Сервер поменяет имя или тип поля — упадёт здесь, а не в приложении.
///
/// Отдельная группа сверяет рейтинг: формула клиента (`RatingCalculator`) против
/// чисел сервера из `/api/rankings`. Совпадение до «копейки» — единственная
/// честная проверка того, что копия `arena-2` не разъехалась с Go.
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:fps_app/entities/athlete/athlete.dart';
import 'package:fps_app/entities/athlete_result/athlete_result.dart';
import 'package:fps_app/entities/competition/competition.dart';
import 'package:fps_app/entities/discipline/discipline.dart';
import 'package:fps_app/entities/rating/rating.dart';

import 'support/fixtures.dart';

void main() {
  group('GET /api/competitions', () {
    final items = [
      for (final json in fixtureList('competition_list.json'))
        Competition.fromJson(json),
    ];

    test('список читается целиком', () {
      expect(items, hasLength(2));
      expect(items.map((c) => c.id), ['8', '9']);
    });

    test(
      'int64 id становится строкой, enum-ы разбираются по ключам сервера',
      () {
        final first = items.first;
        // id сервер отдаёт числом, клиент — строкой: иначе 64-битное значение
        // потерялось бы в double.
        expect(first.id, '8');
        expect(first.level, CompetitionLevel.regional);
        expect(first.format, CompetitionFormat.individual);
        expect(first.status, CompetitionStatus.completed);
        expect(first.stage, CompetitionStage.standalone);
        expect(
          items.last.isTeam,
          isTrue,
          reason: 'второй турнир — командный зачёт',
        );
      },
    );

    test('даты с часовым поясом (+03:00) не съезжают', () {
      final first = items.first;
      expect(
        first.startsAt.toUtc(),
        DateTime.utc(2026, 9, 13, 2, 44),
        reason: '05:44 MSK = 02:44 UTC',
      );
      expect(
        first.registrationDeadline.toUtc(),
        DateTime.utc(2026, 9, 11, 2, 44),
      );
    });

    test('счётчики заявок и протокола приходят из списка', () {
      expect(items.first.registrationsCount, 6);
      expect(items.first.resultsCount, 6);
      // Пустой `qualifying_*` у самостоятельного турнира — null, а не 0:
      // ноль выглядел бы как «связка с турниром №0».
      expect(items.first.qualifyingCompetitionId, isNull);
      expect(items.first.qualifyingPlaceLimit, isNull);
    });
  });

  group('GET /api/competitions/{id}', () {
    final detail = CompetitionDetail.fromJson(
      fixture('competition_detail.json'),
    );

    test('карточка, заявки, протокол и команды — одним объектом', () {
      expect(detail.competition.id, '8');
      expect(detail.registered, isFalse);
      expect(detail.registrations, hasLength(2));
      expect(detail.results, hasLength(2));
      expect(detail.teams, isEmpty);
      expect(detail.hasProtocol, isTrue);
    });

    test('заявка разбирается по полям сервера', () {
      final registration = detail.registrations.first;
      expect(registration.athleteId, '18');
      expect(registration.fullName, 'Арсен Муртазалиев');
      expect(registration.organization, 'ДГУ');
      expect(registration.city, 'Дербент');
      expect(registration.createdAt.isAfter(DateTime(2026)), isTrue);
    });

    test('строка протокола: место, результат и ФИО от сервера', () {
      final entry = detail.results.first;
      expect(entry.id, '83');
      expect(entry.athleteId, '18');
      // Личный зачёт: `team_id` у строки нет вовсе — сервер его не отдаёт.
      expect(entry.isTeam, isFalse);
      expect(entry.place, 1);
      expect(entry.scoreText, '6 задач');
      expect(entry.name, 'Арсен Муртазалиев');
    });

    test('без составов все заявители свободны для команды', () {
      expect(detail.unassignedRegistrations, hasLength(2));
    });

    test(
      'завершённый турнир: заявка закрыта, протокол можно выпустить снова',
      () {
        final now = DateTime.utc(2026, 9, 23);
        expect(detail.competition.isRegistrationOpen(now), isFalse);
        // Сервер не запрещает перевыпускать протокол завершённого старта
        // (старая версия архивируется), поэтому и кнопка остаётся.
        expect(detail.competition.canPublishResults(now), isTrue);
      },
    );
  });

  group('GET /api/me/registrations', () {
    final mine = [
      for (final json in fixtureList('my_registrations.json'))
        Competition.fromJson(json),
    ];

    test('сервер отдаёт сами турниры, а не «записи о заявках»', () {
      // Это осознанный контракт API: клиенту хватает карточки турнира,
      // отдельного статуса заявки нет (есть факт строки в таблице).
      expect(mine.map((c) => c.id), ['14', '13']);
      expect(mine.every((c) => c.status == CompetitionStatus.open), isTrue);
      expect(mine.first.registrationsCount, 12);
    });
  });

  group('GET /api/disciplines', () {
    final disciplines = [
      for (final json in fixtureList('disciplines.json'))
        Discipline.fromJson(json),
    ];

    test('справочник: код и название', () {
      expect(disciplines, hasLength(5));
      expect(disciplines.first.code, 'algorithmic');
      expect(disciplines.first.name, 'Алгоритмическое программирование');
      expect(
        disciplines.map((d) => d.code),
        containsAll(<String>['uav', 'security', 'robotics']),
      );
    });
  });

  group('GET /api/me', () {
    final session = CurrentSession.fromJson(fixture('me.json'));

    test('пользователь и анкета в одном ответе', () {
      expect(session.user.id, '2');
      expect(session.user.email, isNotEmpty);
      expect(session.user.isOrganizer, isFalse);
      expect(session.isOrganizer, isFalse);
      expect(session.athlete, isNotNull);
    });

    test('анкета: разряд по ключу сервера и дисциплины списком', () {
      final athlete = session.athlete!;
      expect(athlete.fullName, 'Амина Алиева');
      expect(athlete.rank, AthleteRank.candidateMaster);
      expect(athlete.disciplineCodes, ['algorithmic']);
      expect(athlete.rulesVersion, RatingCalculator.rulesVersion);
    });

    test('сумма рейтинга собрана из частей, как её считает сервер', () {
      final athlete = session.athlete!;
      // rating = очки четырёх лучших + бонус разряда, каждый уже округлён.
      expect(
        athlete.rating,
        RatingCalculator.round(athlete.resultPoints + athlete.rankPoints),
      );
      expect(
        athlete.rankPoints,
        RatingCalculator.round(athlete.rankBase * athlete.activityFactor),
      );
      expect(athlete.resultPoints, 995.33);
      expect(athlete.rating, 1073.17);
    });

    test('в рейтинг входят ровно четыре лучших результативных старта', () {
      final results = session.athlete!.results;
      final included = results.where((r) => r.included).toList();
      expect(included, hasLength(RatingCalculator.bestCount));
      // Каждая включённая строка не меньше любой выключенной — иначе сервер
      // считал бы не «лучшие», а «первые попавшиеся».
      final lowestIncluded = included.map((r) => r.points).reduce(_minDouble);
      for (final excluded in results.where((r) => !r.included)) {
        expect(excluded.points, lessThanOrEqualTo(lowestIncluded));
      }
    });

    test('очки строки равны произведению коэффициентов', () {
      for (final result in session.athlete!.results) {
        final product = RatingCalculator.round(
          result.base *
              result.placeFactor *
              result.sizeFactor *
              result.relativeFactor *
              result.decay,
        );
        expect(result.points, product, reason: result.formula);
      }
    });
  });

  group('GET /api/rankings', () {
    final page = RankingPage.fromJson(fixture('rankings.json'));

    test('дата расчёта и список спортсменов', () {
      expect(page.athletes, hasLength(2));
      expect(page.asOf.isAfter(DateTime(2026)), isTrue);
      expect(page.athletes.first.ratingPlace, 1);
      expect(page.athletes.last.ratingPlace, 2);
    });

    test('наша копия arena-2 повторяет числа сервера до копейки', () {
      // Проверяем на реальном профиле: строки истории превращаем обратно во
      // вход формулы и считаем ещё раз тем же `as_of`.
      for (final server in page.athletes) {
        final ours = RatingCalculator.calculate(
          profile: Athlete.profile(
            id: server.id,
            fullName: server.fullName,
            city: server.city,
            organization: server.organization,
            rank: server.rank,
            disciplineCodes: server.disciplineCodes,
          ),
          rows: [for (final r in server.results) _rowOf(r)],
          asOf: page.asOf,
        );

        expect(
          ours.rankBase,
          server.rankBase,
          reason: 'Q(разряд) ${server.rank}',
        );
        expect(ours.resultPoints, server.resultPoints);
        expect(ours.rankPoints, server.rankPoints);
        expect(ours.rating, server.rating, reason: server.fullName);
        expect(
          ours.results.map((r) => r.points),
          server.results.map((r) => r.points),
        );
        expect(
          ours.results.map((r) => r.included),
          server.results.map((r) => r.included),
          reason: 'в четвёрку должны попадать те же старты',
        );
      }
    });

    test('этап «отбор» коэффициенты показывает, но очков не даёт', () {
      final qualification = page.athletes
          .expand((a) => a.results)
          .where((r) => r.stage == CompetitionStage.qualification)
          .toList();
      expect(qualification, isNotEmpty, reason: 'в фикстуре есть отбор');
      for (final row in qualification) {
        expect(row.points, 0);
        expect(row.included, isFalse);
        // Коэффициенты при этом ненулевые: сервер их заполняет до проверки
        // этапа, и интерфейс показывает «почему ноль».
        expect(row.sizeFactor, greaterThan(0));
        expect(row.decay, greaterThan(0));
      }
    });
  });
}

/// Строка истории обратно во вход формулы: ровно те поля, которые сервер и
/// достаёт из БД перед расчётом.
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

double _minDouble(double a, double b) => a < b ? a : b;
