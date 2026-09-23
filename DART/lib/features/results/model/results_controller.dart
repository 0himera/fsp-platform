/// Контроллер итогового протокола (п.3 ТЗ: «внесение результатов»).
///
/// ФОРМА РАБОТЫ повтора то, что делает сервер: протокол публикуется ЦЕЛИКОМ
/// (`PUT /api/competitions/{id}/results` заменяет все строки в транзакции),
/// поэтому и здесь мы держим список строк, а не «добавить одну запись».
///
/// ОТКУДА БЕРУТСЯ СТРОКИ: их нельзя выдумать. Право на участие даёт заявка
/// (личный зачёт) или собранная команда (командный), и сервер это проверяет:
/// строка про участника без заявки -> 400. Поэтому список инициализируется из
/// карточки турнира, а организатор меняет только МЕСТО и РЕЗУЛЬТАТ.
library;

import 'package:flutter/foundation.dart';

import '../../../entities/competition/competition.dart';
import '../../../shared/utils/utils.dart';

class ResultsController extends ChangeNotifier {
  ResultsController({required this._competitions});

  final CompetitionService _competitions;

  /// Черновик протокола, который редактирует организатор.
  List<ProtocolEntry> rows = const [];

  /// Карточка турнира, из которой мы начали: нужна и форматом зачёта (для
  /// проверки), и id соревнования.
  CompetitionDetail? source;

  bool isLoading = false;
  String? error;

  /// Начать работу по карточке: опубликованный протокол редактируется как есть,
  /// пустой набирается по составу участников.
  void startFrom(CompetitionDetail detail) {
    source = detail;
    rows = detail.results.isNotEmpty
        ? List.of(detail.results)
        : _entrants(detail);
    error = null;
    notifyListeners();
  }

  /// Участники, которым сервер разрешит иметь строку: команды в командном
  /// зачёте, заявителя — в личном. Места проставляются по порядку списка:
  /// это только стартовая подсказка, которую организатор правит.
  static List<ProtocolEntry> _entrants(CompetitionDetail detail) {
    // Индекс вместо `indexOf`: так цикл остаётся линейным, и порядок мест
    // явно совпадает с порядком списка.
    final teams = detail.teams;
    if (detail.competition.isTeam) {
      return [
        for (var i = 0; i < teams.length; i++)
          ProtocolEntry(teamId: teams[i].id, place: i + 1, name: teams[i].name),
      ];
    }
    final registrations = detail.registrations;
    return [
      for (var i = 0; i < registrations.length; i++)
        ProtocolEntry(
          athleteId: registrations[i].athleteId,
          place: i + 1,
          name: registrations[i].fullName,
        ),
    ];
  }

  void clear() {
    source = null;
    rows = const [];
    error = null;
    notifyListeners();
  }

  /// Изменить место или текст результата строки.
  ///
  /// Строка ищется по `entrantId`, а не по индексу: порядок на экране может
  /// быть другим, а участник у строки неизменный.
  void edit(String entrantId, {int? place, String? scoreText}) {
    rows = [
      for (final row in rows)
        if (row.entrantId == entrantId)
          row.copyWith(
            place: place == null ? row.place : (place <= 0 ? 1 : place),
            scoreText: scoreText,
          )
        else
          row,
    ];
    notifyListeners();
  }

  /// Убрать строку: например, участник не пришёл и в протоколе его быть не
  /// должно. Добавить нового «с улицы» нельзя — его не было среди заявок.
  void remove(String entrantId) {
    rows = [
      for (final row in rows)
        if (row.entrantId != entrantId) row,
    ];
    // После удаления меняется длина протокола, а с ней и допустимый диапазон
    // мест (сервер требует 1 ≤ place ≤ числа строк), поэтому перенумеровываем.
    _renumber();
    notifyListeners();
  }

  /// Проставить места 1..N в текущем порядке — подсказка, когда строк много.
  void renumber() {
    _renumber();
    notifyListeners();
  }

  void _renumber() {
    rows = [
      for (var i = 0; i < rows.length; i++) rows[i].copyWith(place: i + 1),
    ];
  }

  /// Текст проблемы с протоколом или null. Те же правила проверяет сервер, но
  /// организатор видит подсказку до отправки запроса.
  String? get problem {
    final detail = source;
    if (detail == null) return 'Соревнование не выбрано';
    return protocolError(rows, format: detail.competition.format);
  }

  /// Опубликовать протокол. Возвращает обновлённую карточку (сервер отвечает
  /// ею) или null, если не вышло — текст ошибки лежит в `error`.
  Future<CompetitionDetail?> publish() async {
    final detail = source;
    if (detail == null) return null;
    final problem = this.problem;
    if (problem != null) {
      // Не начинаем запрос, который сервер точно отклонит: 400 с чужим
      // «Проверьте данные соревнования и протокола» объяснит меньше, чем эта
      // строка.
      error = problem;
      notifyListeners();
      return null;
    }
    if (isLoading) return null;
    isLoading = true;
    error = null;
    notifyListeners();
    CompetitionDetail? updated;
    try {
      updated = await _competitions.publishProtocol(
        competitionId: detail.competition.id,
        protocol: rows,
      );
      // Публикация меняет и статус, и даты, и счётчик результатов — берём всё
      // из ответа сервера, а не правим локально.
      source = updated;
      rows = List.of(updated.results);
    } on Exception catch (e) {
      error = failureMessage(e);
    } finally {
      isLoading = false;
      notifyListeners();
    }
    return updated;
  }
}
