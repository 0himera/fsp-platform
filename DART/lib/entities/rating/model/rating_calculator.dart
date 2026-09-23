/// МОДЕЛЬ РЕЙТИНГА `arena-2` — точная копия серверной формулы
/// (backend/internal/rating/rating.go).
///
/// ЗАЧЕМ ОНА КЛИЕНТУ, ЕСЛИ РЕЙТИНГ СЧИТАЕТ СЕРВЕР:
///  1) тестовая подмена из `test/support/mock/` обязана показывать ТЕ ЖЕ
///     числа, что и бэкенд, иначе «тесты» и «прод» разошлись бы, и это
///     выглядело бы как баг клиента;
///  2) тесты на этой формуле проверяют наше понимание правил, а не только то,
///     что JSON разобрался;
///  3) интерфейс может объяснить число до запроса («почему 12,5») — см. поля
///     `AthleteResult`, которые эта функция и заполняет.
///
/// ПРАВИЛА (README, раздел «Рейтинг arena-2»):
///
///   P = B(уровень) × C(место) × √(min(N,16)/16) × (N − p)/(N − 1) × D(давность)
///   R = сумма 4 лучших P + Q(разряд) × A(дни после последнего результативного старта)
///
/// ОБОСНОВАНИЕ МНОЖИТЕЛЕЙ
///  • B — цена уровня: 120 … 1000. Разрыв «регион → Россия» (120 → 1000) велик
///    сознательно: победа в регионе и победа на чемпионате страны — разные по
///    составу соревнования.
///  • C — коэффициент места 1; 0,7; 0,5; 0,3; далее 0,15·6/p. Ступени в первых
///    местах и пологий «хвост»: разрыв между 1-м и 2-м должен быть большим,
///    а между 20-м и 21-м — почти нулевым.
///  • √(min(N,16)/16) — сила поля, но с потолком в 16 человек: сетка на 500
///    участников не должна в 5 раз «весить» сетку на 16.
///  • (N − p)/(N − 1) — относительное место: последнее место даёт 0, первое — 1.
///    Поэтому зачёт при N < 2 не существует (одному участнику не с кем
///    сравниваться), и место вне диапазона очков не даёт.
///  • D — давность: 0 дней → 1; до 730 дней спад до 0,4; до 1095 — до 0;
///    дальше очки обнуляются. Три года — срок, за который обычно подтверждают
///    или получают новый разряд.
///  • Этап «отбор» очков не даёт (остается в истории), финал считается обычно.
///  • Q × A — бонус разряда: звание само по себе не заменяет старты, оно
///    «размораживается» активностью A (через 730 дней без результативных
///    стартов бонус равен нулю, но разряд в профиле остаётся).
///  • Четыре лучших — против накрутки: 50 слабых стартов сумму не поднимут,
///    а один сверхуспех не задериет рейтинг выше реальной силы.
library;

import 'dart:math' as math;

import '../../athlete/athlete.dart';
import '../../athlete_result/athlete_result.dart';
import '../../competition/competition.dart';
import 'rating_row.dart';

class RatingCalculator {
  const RatingCalculator();

  /// Версия правил. Сервер отдаёт её в каждом профиле (`rules_version`);
  /// совпадение строки — признак, что клиент и бэкенд считают одно и то же.
  static const String rulesVersion = 'arena-2';

  /// Сколько лучших результатов формируют рейтинг.
  static const int bestCount = 4;

  /// B(уровень) — база очков. Ключ — enum уровня, значения дословно из
  /// `levelBase` в rating.go.
  static const Map<CompetitionLevel, double> levelBase = {
    CompetitionLevel.rfChampionship: 1000,
    CompetitionLevel.allRussian: 650,
    CompetitionLevel.interregional: 400,
    CompetitionLevel.rdChampionship: 250,
    CompetitionLevel.regional: 120,
  };

  /// Q(разряд) — бонус за высший подтверждённый разряд, из `rankBonus`.
  static const Map<AthleteRank, double> rankBonus = {
    AthleteRank.third: 10,
    AthleteRank.second: 20,
    AthleteRank.first: 45,
    AthleteRank.candidateMaster: 80,
    AthleteRank.master: 130,
    AthleteRank.masterInternational: 180,
    AthleteRank.honoredMaster: 250,
  };

  /// Потолок «силы поля»: свыше этого числа участников сетка не «дороже».
  static const int sizeCap = 16;

  /// D(давность): плавная кривая через точки 0 → 1, 365 → 0,7, 730 → 0,4,
  /// 1095 → 0. Отрицательный срок (старт «из будущего») = 1: свежий.
  static double decay(double days) {
    if (days <= 0) return 1;
    if (days < 730) return 1 - 0.3 * days / 365;
    if (days < 1095) return 0.4 * (1095 - days) / 365;
    return 0;
  }

  /// A(активность): 1 → 0 за 730 дней после последнего результативного старта.
  static double activity(double days) =>
      math.max(0, math.min(1, 1 - days / 730));

  /// C(место). После 5-го места коэффициент убывает как 0,9/p: шаг между
  /// 20-м и 21-м рядом меньше, чем между 1-м и 2-м, — «хвост» протокола
  /// не наказывается чрезмерно.
  static double placeFactor(int place) {
    switch (place) {
      case 1:
        return 1;
      case 2:
        return 0.7;
      case 3:
        return 0.5;
      case 4:
      case 5:
        return 0.3;
      default:
        if (place >= 6) return 0.15 * 6 / place;
        // place < 1 — в протоколе такого быть не может (сервер не примет),
        // но ноль вместо отрицательного коэффициента безопаснее.
        return 0;
    }
  }

  static double baseOf(CompetitionLevel level) => levelBase[level] ?? 0;

  static double bonusOf(AthleteRank? rank) =>
      rank == null ? 0 : (rankBonus[rank] ?? 0);

  /// Округление как в Go: два знака, половина — от нуля (`math.Round`).
  static double round(double value) => (value * 100).roundToDouble() / 100;

  /// Сколько суток прошло от [from] до [to] — с точностью до микросекунд.
  static double _daysBetween(DateTime to, DateTime from) =>
      to.difference(from).inMicroseconds / Duration.microsecondsPerDay;

  /// Одна строка истории: вход формулы -> `AthleteResult` со всеми
  /// коэффициентами и итогами. `included` здесь всегда false: «попал ли
  /// результат в четвёрку» решает [calculate], где видны все строки сразу.
  static AthleteResult score(RatingRow row, DateTime asOf) {
    // Дробные сутки, а не целые часы: Go считает `asOf.Sub(endsAt).Hours()/24`,
    // и округление до часа уводило бы D(давность) на миллионные доли — ровно
    // настолько, чтобы на границе разряда «копейки» разойтись с сервером.
    final days = math.max(0.0, _daysBetween(asOf, row.endsAt));
    // Два условия, не одно: сервер заполняет коэффициенты для любого старта
    // с N ≥ 2 и корректным местом, а очки не даёт ещё и этапу «отбор».
    // Поэтому у строки отбора в API видим непустые size/relative/decay при
    // points = 0 — и мы должны показать то же самое.
    final countable =
        row.finishers >= 2 && row.place >= 1 && row.place <= row.finishers;
    final scores = countable && row.stage != CompetitionStage.qualification;

    final result = AthleteResult(
      competitionId: row.competitionId,
      competitionTitle: row.competitionTitle,
      disciplineCode: row.disciplineCode,
      level: row.level,
      stage: row.stage,
      endsAt: row.endsAt,
      place: row.place,
      finishers: row.finishers,
      base: baseOf(row.level),
      placeFactor: placeFactor(row.place),
      // У не зачтённой строки (место вне сетки или N < 2) нули честнее:
      // они сразу объясняют, почему очков нет.
      sizeFactor: countable
          ? math.sqrt(math.min(row.finishers, sizeCap) / sizeCap)
          : 0,
      relativeFactor: countable
          ? (row.finishers - row.place) / (row.finishers - 1)
          : 0,
      decay: countable ? decay(days) : 0,
      points: 0,
      included: false,
    );

    if (!scores) return result;
    return result.copyWith(
      points: round(
        result.base *
            result.placeFactor *
            result.sizeFactor *
            result.relativeFactor *
            result.decay,
      ),
    );
  }

  /// Рейтинг спортсмена: анкета [profile] (без очков) + строки истории [rows].
  ///
  /// [asOf] передаётся извне, а не берётся как `DateTime.now()`: тесты «результату
  /// 800 дней» иначе падали бы в зависимости от дня запуска.
  static Athlete calculate({
    required Athlete profile,
    required List<RatingRow> rows,
    required DateTime asOf,
  }) {
    var scored = [for (final row in rows) score(row, asOf)];

    // Порядок: очки по убыванию, при равенстве — более свежий старт выше.
    // Dart-овский `sort` не стабилен, поэтому сравниваем ещё и исходным
    // индексом: иначе одинаковые строки переставлялись бы между запусками.
    final order = [for (var i = 0; i < scored.length; i++) i];
    order.sort((a, b) {
      final x = scored[a];
      final y = scored[b];
      if (x.points != y.points) return y.points.compareTo(x.points);
      if (!x.endsAt.isAtSameMomentAs(y.endsAt)) {
        return y.endsAt.compareTo(x.endsAt);
      }
      return a.compareTo(b);
    });
    scored = [for (final i in order) scored[i]];

    var resultPoints = 0.0;
    DateTime? latest;
    for (var i = 0; i < scored.length; i++) {
      final result = scored[i];
      if (result.points <= 0) continue;
      // Последний «очковый» старт активирует бонус разряда.
      if (latest == null || result.endsAt.isAfter(latest)) {
        latest = result.endsAt;
      }
      if (i >= bestCount) continue;
      scored[i] = result.copyWith(included: true);
      resultPoints += result.points;
    }

    final rankBase = bonusOf(profile.rank);
    // A(активность) считается от последнего результативного старта; если таких
    // нет — бонус разряда равен нулю, каким бы высоким он ни был.
    final activityFactor = latest == null
        ? 0.0
        : activity(math.max(0.0, _daysBetween(asOf, latest)));

    // Тот же порядок округлений, что в Go: сначала слагаемые, потом сумма.
    final resultScore = round(resultPoints);
    final rankScore = round(rankBase * activityFactor);

    return Athlete(
      id: profile.id,
      fullName: profile.fullName,
      city: profile.city,
      organization: profile.organization,
      rank: profile.rank,
      disciplineCodes: profile.disciplineCodes,
      ratingPlace: profile.ratingPlace,
      rating: round(resultScore + rankScore),
      resultPoints: resultScore,
      rankBase: rankBase,
      activityFactor: activityFactor,
      rankPoints: rankScore,
      results: scored,
      rulesVersion: rulesVersion,
    );
  }

  /// Таблица рейтинга: сортировка по сумме, место делится при равенстве очков
  /// (README: «спортсмены с одинаковой суммой делят место», порядок — по ФИО).
  static List<Athlete> rankAll(List<Athlete> athletes) {
    // Индекс в списке — порядок «как из БД» (у сервера — по user_id). Он и
    // разрешает ничью однофамильцев с одинаковой суммой, иначе таблица
    // переставляла бы их от запуска к запуску: List.sort в Dart не стабилен.
    final order = [for (var i = 0; i < athletes.length; i++) i];
    order.sort((a, b) {
      final x = athletes[a];
      final y = athletes[b];
      if (x.rating != y.rating) return y.rating.compareTo(x.rating);
      final byName = x.fullName.compareTo(y.fullName);
      return byName != 0 ? byName : a.compareTo(b);
    });

    final ranked = <Athlete>[];
    for (var i = 0; i < order.length; i++) {
      final athlete = athletes[order[i]];
      final sameAsPrevious =
          // Как на сервере: место делится при равной сумме, в том числе
          // нулевой — поэтому «0 очков» у двоих даёт одно и то же место.
          i > 0 && athlete.rating == ranked[i - 1].rating;
      ranked.add(
        athlete.copyWithPlace(
          sameAsPrevious ? ranked[i - 1].ratingPlace : i + 1,
        ),
      );
    }
    return ranked;
  }
}
