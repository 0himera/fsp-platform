/// Контроллер рейтинга (п.4 ТЗ — ключевой модуль).
///
/// РЕЙТИНГ СЧИТАЕТ СЕРВЕР. `GET /api/rankings` отдаёт уже готовые суммы и
/// разложение по коэффициентам, поэтому задача фичи — один раз запросить
/// таблицу, аккуратно её показать и объяснить числа. Пересчёт на клиенте
/// создал бы вторую версию правды, и она неминуемо разошлась бы с таблицей.
///
/// ФИЛЬТРЫ ЗДЕСЬ ЛОКАЛЬНЫЕ (в отличие от списка соревнований): сервер отдаёт
/// весь рейтинг одним запросом без параметров, поэтому резать его по строке
/// поиска дешевле на клиенте.
library;

import 'package:flutter/foundation.dart';

import '../../../entities/athlete/athlete.dart';
import '../../../entities/rating/rating.dart';
import '../../../shared/utils/utils.dart';

class RatingController extends ChangeNotifier {
  RatingController({required this._athletes});

  final AthleteService _athletes;

  /// Спортсмены в том порядке, в котором их отдал сервер (по очкам, при
  /// равенстве — по ФИО; место при равенстве общее).
  List<Athlete> athletes = const [];

  /// Момент расчёта рейтинга из ответа сервера. Без этой строки таблица
  /// выглядела бы «истинной сейчас», хотя могла быть посчитана вчера.
  DateTime? asOf;

  String query = '';

  /// Фильтр по коду дисциплины; null = «все».
  String? disciplineCode;

  bool isLoading = false;
  String? error;

  /// Версия правил, которую назвал сервер. Показываем её в интерфейсе:
  /// если клиент и бэкенд однажды начнут считать разное, это станет видно
  /// не по странным числам, а по надписи.
  String get rulesVersion =>
      athletes.isEmpty ? '' : athletes.first.rulesVersion;

  List<Athlete> get visible {
    final search = query.trim().toLowerCase();
    final discipline = disciplineCode;
    return [
      for (final athlete in athletes)
        if (discipline == null || athlete.disciplineCodes.contains(discipline))
          if (search.isEmpty ||
              athlete.fullName.toLowerCase().contains(search) ||
              athlete.organization.toLowerCase().contains(search) ||
              athlete.city.toLowerCase().contains(search))
            athlete,
    ];
  }

  Athlete? byId(String id) {
    for (final athlete in athletes) {
      if (athlete.id == id) return athlete;
    }
    return null;
  }

  Future<void> load() async {
    if (isLoading) return;
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      final page = await _athletes.rankings();
      athletes = page.athletes;
      asOf = page.asOf;
    } on Exception catch (e) {
      error = failureMessage(e);
      athletes = const [];
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void search(String text) {
    query = text;
    notifyListeners();
  }

  void filterDiscipline(String? code) {
    // Повторный выбор того же значения снимает фильтр — «показать всех» в
    // один тап.
    disciplineCode = disciplineCode == code ? null : code;
    notifyListeners();
  }

  /// Расшифровка чисел для карточки спортсмена: из чего сложена сумма.
  ///
  /// П.4 ТЗ требует не только посчитать рейтинг, но и обосновать его. Худшее,
  /// что можно показать спортсмену, — голую цифру: он не сможет ни проверить,
  /// ни понять, что улучшать.
  static String explain(Athlete athlete) {
    final counted = [
      for (final result in athlete.results)
        if (result.included) result,
    ];
    final parts = [
      for (final result in counted)
        '${result.place}-е место, ${result.competitionTitle} — ${result.points}',
    ];
    final results = counted.isEmpty
        ? 'зачётных стартов пока нет'
        : '${counted.length} лучших: ${parts.join('; ')}';
    final rank = athlete.rank == null
        ? 'разряд не присвоен — бонус 0'
        : 'разряд ${athlete.rank!.label} (${RatingCalculator.bonusOf(athlete.rank)})'
              ' × активность ${athlete.activityFactor} = ${athlete.rankPoints}';
    return '$results. $rank. Итого ${athlete.rating}.';
  }
}
