/// Ответ `GET /api/rankings` целиком: `{ "athletes": [...], "as_of": "..." }`.
///
/// Почему не просто `List<Athlete>`: рейтинг считается при чтении, и сервер
/// отдаёт момент расчёта. Без него таблица выглядела бы «истинной сейчас»,
/// хотя могла быть посчитана час назад — в интерфейсе мы показываем `asOf`.
library;

import 'athlete.dart';

class RankingPage {
  const RankingPage({required this.athletes, required this.asOf});

  /// Спортсмены, отсортированные сервером по убыванию очков (при равенстве
  /// очков — по ФИО; место при этом общее, см. `rating_place`).
  final List<Athlete> athletes;

  final DateTime asOf;

  factory RankingPage.fromJson(Map<String, dynamic> json) {
    final raw = json['athletes'];
    return RankingPage(
      athletes: raw is List
          ? [
              for (final item in raw)
                if (item is Map<String, dynamic>) Athlete.fromJson(item),
            ]
          : const [],
      // Неразобранная дата не должна ронять весь рейтинг: ставим текущий
      // момент — он честно означает «расчёт актуален на сейчас».
      asOf:
          DateTime.tryParse(json['as_of']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
