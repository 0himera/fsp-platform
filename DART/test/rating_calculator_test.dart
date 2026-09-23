/// Формула `arena-2` на синтетических случаях.
///
/// Фикстуры (`fixtures_test.dart`) доказывают, что наша копия совпадает с
/// сервером на реальных числах. Этот файл закрывает обратное: правила, которых
/// в удачном снимке может не быть, — граница давности, «последнее место»,
/// отборочный этап, четвёрка лучших, бонус разряда без активных стартов.
///
/// Все расчёты идут с фиксированной датой `asOf`: иначе тест зависел бы от дня
/// запуска.
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:fps_app/entities/athlete/athlete.dart';
import 'package:fps_app/entities/athlete_result/athlete_result.dart';
import 'package:fps_app/entities/competition/competition.dart';
import 'package:fps_app/entities/rating/rating.dart';

/// Условное «сейчас»: 23 сентября 2026, 02:00 UTC.
final DateTime asOf = DateTime.utc(2026, 9, 23, 2);

void main() {
  group('коэффициенты', () {
    test('B(уровень) — таблица сервера', () {
      expect(RatingCalculator.baseOf(CompetitionLevel.rfChampionship), 1000);
      expect(RatingCalculator.baseOf(CompetitionLevel.allRussian), 650);
      expect(RatingCalculator.baseOf(CompetitionLevel.interregional), 400);
      expect(RatingCalculator.baseOf(CompetitionLevel.rdChampionship), 250);
      expect(RatingCalculator.baseOf(CompetitionLevel.regional), 120);
    });

    test('C(место): первые пять по ступеням, дальше 0,9/p', () {
      expect(RatingCalculator.placeFactor(1), 1);
      expect(RatingCalculator.placeFactor(2), 0.7);
      expect(RatingCalculator.placeFactor(3), 0.5);
      expect(RatingCalculator.placeFactor(4), 0.3);
      expect(RatingCalculator.placeFactor(5), 0.3);
      expect(RatingCalculator.placeFactor(6), closeTo(0.15, 1e-12));
      expect(RatingCalculator.placeFactor(9), closeTo(0.1, 1e-12));
    });

    test('D(давность): 0 → 1, год → 0,7, два года → 0,4, три года → 0', () {
      expect(RatingCalculator.decay(0), 1);
      expect(RatingCalculator.decay(365), closeTo(0.7, 1e-12));
      expect(RatingCalculator.decay(730), closeTo(0.4, 1e-12));
      expect(RatingCalculator.decay(1095), 0);
      expect(RatingCalculator.decay(2000), 0);
      // Старт «из будущего» (сервер такое допускает при правке дат) не должен
      // давать коэффициент больше единицы.
      expect(RatingCalculator.decay(-5), 1);
    });

    test('A(активность) гаснет за 730 дней', () {
      expect(RatingCalculator.activity(0), 1);
      expect(RatingCalculator.activity(365), closeTo(0.5, 1e-12));
      expect(RatingCalculator.activity(730), 0);
      expect(RatingCalculator.activity(1000), 0);
    });

    test('сила поля растёт до 16 участников и дальше не меняется', () {
      final small = _score(place: 1, finishers: 4);
      final capped = _score(place: 1, finishers: 16);
      final huge = _score(place: 1, finishers: 500);
      expect(small.sizeFactor, closeTo(0.5, 1e-12));
      expect(capped.sizeFactor, 1);
      expect(huge.sizeFactor, 1, reason: 'потолок sizeCap = 16');
    });
  });

  group('очков нет, когда', () {
    test('в зачёте меньше двух участников — сравнивать не с кем', () {
      final result = _score(place: 1, finishers: 1);
      expect(result.points, 0);
      expect(result.sizeFactor, 0);
      expect(result.relativeFactor, 0);
    });

    test('место вне сетки (p > N)', () {
      final result = _score(place: 7, finishers: 5);
      expect(result.points, 0);
      expect(result.placeFactor, closeTo(0.9 / 7, 1e-12));
      expect(
        result.decay,
        0,
        reason: 'незачтённая строка не показывает давность',
      );
    });

    test('последнее место: относительный коэффициент нулевой', () {
      final result = _score(place: 5, finishers: 5);
      expect(result.relativeFactor, 0);
      expect(result.points, 0);
    });

    test('этап «отбор»: коэффициенты видны, очков нет', () {
      final result = _score(
        place: 1,
        finishers: 20,
        stage: CompetitionStage.qualification,
      );
      expect(result.sizeFactor, greaterThan(0));
      expect(result.decay, greaterThan(0));
      expect(result.points, 0);
      expect(result.scores, isFalse);
    });
  });

  group('одна строка', () {
    test('очки = произведение коэффициентов, округлённое до копеек', () {
      // Региональный уровень, 1-е место из 2, свежий старт.
      final result = _score(place: 1, finishers: 2);
      expect(result.base, 120);
      expect(result.sizeFactor, closeTo(0.3535533905932738, 1e-12));
      expect(result.points, 42.43);
      // Разделитель — точка: `toStringAsFixed` печатает по-английски, а смысл
      // строки в том, чтобы её можно было сверить с числами выше.
      expect(result.formula, '120 × 1.00 × 0.35 × 1.00 × 1.00');
    });

    test('давность считается дробными сутками, как в Go', () {
      // Ровно через год после финиша: 1 - 0,3 = 0,7 без потери на округлении
      // до целых часов.
      final result = _score(
        place: 1,
        finishers: 16,
        endsAt: asOf.subtract(const Duration(days: 365)),
      );
      expect(result.decay, closeTo(0.7, 1e-9));
      expect(result.points, closeTo(84, 0.01));
    });
  });

  group('итог спортсмена', () {
    test('в сумму попадают четыре лучших старта, пятый — мимо', () {
      final athlete = RatingCalculator.calculate(
        profile: _profile(),
        rows: [for (var i = 0; i < 5; i++) _row(place: 1, finishers: 16)],
        asOf: asOf,
      );
      // 120 × 1 × 1 × 1 × 1 = 120 за каждый старт.
      expect(athlete.results.where((r) => r.included), hasLength(4));
      expect(athlete.resultPoints, 480);
    });

    test('разряд даёт бонус, пока последний результативный старт свежий', () {
      final athlete = RatingCalculator.calculate(
        profile: _profile(rank: AthleteRank.master),
        rows: [_row(place: 1, finishers: 16)],
        asOf: asOf,
      );
      expect(athlete.rankBase, 130);
      expect(athlete.activityFactor, 1);
      expect(athlete.rankPoints, 130);
      expect(athlete.rating, 250, reason: '120 очков + 130 бонус');
    });

    test('без результативных стартов бонус разряда обнуляется', () {
      // Единственный участник сетки: очков нет, активировать бонус нечему.
      final athlete = RatingCalculator.calculate(
        profile: _profile(rank: AthleteRank.honoredMaster),
        rows: [_row(place: 1, finishers: 1)],
        asOf: asOf,
      );
      expect(athlete.resultPoints, 0);
      expect(athlete.activityFactor, 0);
      expect(athlete.rankPoints, 0);
      expect(athlete.rating, 0);
      // Звание при этом остаётся в профиле — рейтинг его не отменяет.
      expect(athlete.rank, AthleteRank.honoredMaster);
    });

    test('бонус считается от последнего ОЧКОВОГО старта, а не от самого свежего', () {
      final athlete = RatingCalculator.calculate(
        profile: _profile(rank: AthleteRank.candidateMaster),
        rows: [
          // ~два года назад: очков ещё достаточно, чтобы активировать бонус.
          _row(
            place: 1,
            finishers: 16,
            endsAt: asOf.subtract(const Duration(days: 700)),
          ),
          // Вчерашний отбор: самый свежий старт, но очков он не даёт — значит,
          // и активность от него считаться не должен.
          _row(
            place: 1,
            finishers: 16,
            stage: CompetitionStage.qualification,
            endsAt: asOf.subtract(const Duration(days: 1)),
          ),
        ],
        asOf: asOf,
      );
      // D(700) = 1 - 0,3·700/365 → очки есть только у первого старта, от его
      // финиша и берётся A(700) = 1 - 700/730 (сервер: `Points > 0` в цикле
      // подсчёта `latest`).
      expect(athlete.resultPoints, 50.96);
      expect(athlete.activityFactor, closeTo(1 - 700 / 730, 1e-9));
      expect(athlete.rankPoints, 3.29);
      expect(athlete.rating, 54.25);
    });

    test('версия правил приходит из модели, а не из ответа', () {
      final athlete = RatingCalculator.calculate(
        profile: _profile(),
        rows: const [],
        asOf: asOf,
      );
      expect(athlete.rulesVersion, 'arena-2');
    });
  });

  group('таблица рейтинга', () {
    test('равная сумма делит место', () {
      final ranked = RatingCalculator.rankAll([
        _athlete(id: '1', fullName: 'Андреев А.', rating: 100),
        _athlete(id: '2', fullName: 'Борисов Б.', rating: 100),
        _athlete(id: '3', fullName: 'Викторов В.', rating: 90),
      ]);
      expect(ranked.map((a) => a.ratingPlace), [1, 1, 3]);
    });

    test('при равенстве порядок задаётся фамилией — таблица стабильна', () {
      final first = RatingCalculator.rankAll([
        _athlete(id: '2', fullName: 'Борисов Б.', rating: 10),
        _athlete(id: '1', fullName: 'Андреев А.', rating: 10),
      ]);
      final second = RatingCalculator.rankAll([
        _athlete(id: '1', fullName: 'Андреев А.', rating: 10),
        _athlete(id: '2', fullName: 'Борисов Б.', rating: 10),
      ]);
      expect(first.map((a) => a.fullName), second.map((a) => a.fullName));
    });
  });
}

/// Одна строка истории -> результат расчёта (короткая запись для тестов выше).
AthleteResult _score({
  required int place,
  required int finishers,
  CompetitionLevel level = CompetitionLevel.regional,
  CompetitionStage stage = CompetitionStage.standalone,
  DateTime? endsAt,
}) => RatingCalculator.score(
  _row(
    place: place,
    finishers: finishers,
    level: level,
    stage: stage,
    endsAt: endsAt,
  ),
  asOf,
);

RatingRow _row({
  required int place,
  required int finishers,
  CompetitionLevel level = CompetitionLevel.regional,
  CompetitionStage stage = CompetitionStage.standalone,
  DateTime? endsAt,
  String competitionId = '1',
}) => RatingRow(
  competitionId: competitionId,
  competitionTitle: 'Тестовый турнир $competitionId',
  disciplineCode: 'algorithmic',
  level: level,
  stage: stage,
  endsAt: endsAt ?? asOf,
  place: place,
  finishers: finishers,
);

/// Анкета без очков: именно так её отдаёт таблица `athletes` до расчёта.
Athlete _profile({AthleteRank? rank}) => Athlete.profile(
  id: '2',
  fullName: 'Тестовый Спортсмен',
  city: 'Махачкала',
  organization: 'ДГУ',
  rank: rank,
  disciplineCodes: const ['algorithmic'],
);

/// Готовый профиль с известной суммой — для проверки мест в таблице.
Athlete _athlete({
  required String id,
  required String fullName,
  required double rating,
}) => Athlete(
  id: id,
  fullName: fullName,
  city: '',
  organization: '',
  rank: null,
  disciplineCodes: const [],
  rating: rating,
  ratingPlace: 0,
  resultPoints: rating,
  rankBase: 0,
  activityFactor: 0,
  rankPoints: 0,
  results: const <AthleteResult>[],
  rulesVersion: RatingCalculator.rulesVersion,
);
