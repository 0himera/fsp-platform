/// Контроллер админки (п.5 ТЗ: «управление со стороны организатора»).
///
/// Здесь три группы действий организатора:
///  • карточки турниров (создание/правка) — `saveCompetition`;
///  • справочник дисциплин — `addDiscipline` / `renameDiscipline`;
///  • разряды спортсменов и составы команд — `changeRank`, `createTeam`.
///
/// СПИСОК ТУРНИРОВ намеренно НЕ дублируется: его уже держит
/// `CompetitionsController`, и организатор видит в нём черновики (сервер
/// скрывает `draft` от всех остальных). Два списка одних и тех же турниров
/// разошлись бы обязательно.
///
/// ПРАВА ПРОВЕРЯЕТ СЕРВЕР (403 «Недостаточно прав»). То, что мы прячем админские
/// кнопки от спортсмена, — забота об удобстве, а не защита.
library;

import 'package:flutter/foundation.dart';

import '../../../entities/athlete/athlete.dart';
import '../../../entities/competition/competition.dart';
import '../../../entities/discipline/discipline.dart';
import '../../../entities/registration/registration.dart';
import '../../../shared/utils/utils.dart';

class AdminController extends ChangeNotifier {
  AdminController({
    required this._competitions,
    required this._athletes,
    required this._disciplines,
  });

  final CompetitionService _competitions;
  final AthleteService _athletes;
  final DisciplineService _disciplines;

  /// Спортсмены с рейтингом — они же и список для «назначить разряд», и
  /// кандидаты в состав команды. Один запрос `/api/rankings` закрывает обе
  /// задачи, поэтому второго списка «просто анкет» нет.
  List<Athlete> athletes = const [];

  /// Справочник дисциплин: из него собирается выпадающий список в форме
  /// турнира и форма переименования.
  List<Discipline> disciplines = const [];

  bool isLoading = false;
  String? error;

  /// Название дисциплины по коду — чтобы в таблицах не мелькали `uav`.
  String disciplineName(String code) {
    for (final discipline in disciplines) {
      if (discipline.code == code) return discipline.name;
    }
    return code;
  }

  String athleteName(String athleteId) {
    for (final athlete in athletes) {
      if (athlete.id == athleteId) return athlete.fullName;
    }
    return athleteId;
  }

  Future<void> load() async {
    if (isLoading) return;
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      // Два независимых запроса запускаем до await — ждать их по очереди
      // смысла нет.
      final ranked = _athletes.rankings();
      final names = _disciplines.list();
      athletes = (await ranked).athletes;
      disciplines = await names;
    } on Exception catch (e) {
      error = failureMessage(e);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// Создать или обновить турнир. `id == null` — создание.
  ///
  /// Возвращаем карточку, которую ответил сервер: только в ней корректные
  /// статус, счётчики и «пересчитанные» даты.
  Future<Competition?> saveCompetition(String? id, CompetitionDraft draft) =>
      _mutate(() async {
        final problem = draft.validationError;
        if (problem != null) throw ServiceFailure(problem);
        return id == null
            ? await _competitions.create(draft)
            : await _competitions.update(id, draft);
      });

  /// Назначить или снять разряд (`null` = «без разряда»). Сервер отвечает
  /// обновлённой анкетой с новым бонусом — меняем её в своём списке, чтобы
  /// таблица прорисовалась без повторного запроса.
  Future<Athlete?> changeRank(String athleteId, AthleteRank? rank) =>
      _mutate(() async {
        final updated = await _athletes.setRank(athleteId, rank);
        athletes = [
          for (final athlete in athletes)
            if (athlete.id == athleteId) updated else athlete,
        ];
        return updated;
      });

  Future<Discipline?> addDiscipline({
    required String code,
    required String name,
  }) => _mutate(() async {
    final created = await _disciplines.create(code: code, name: name);
    disciplines = [...disciplines, created];
    return created;
  });

  /// Переименование: код остаётся прежним (на него ссылаются турниры и анкеты),
  /// меняется только название — поэтому список правится на месте.
  Future<Discipline?> renameDiscipline({
    required String code,
    required String name,
  }) => _mutate(() async {
    final updated = await _disciplines.rename(code: code, name: name);
    disciplines = [
      for (final discipline in disciplines)
        if (discipline.code == code) updated else discipline,
    ];
    return updated;
  });

  /// Собрать команду. Возвращаем готовый состав — страница перечитывает им
  /// карточку турнира.
  Future<CompetitionTeam?> createTeam({
    required String competitionId,
    required String name,
    required List<String> memberAthleteIds,
  }) => _mutate(
    () => _competitions.createTeam(
      competitionId: competitionId,
      name: name,
      memberAthleteIds: memberAthleteIds,
    ),
  );

  /// Удалить состав. Возвращает признак успеха, а не объект: удалять-то нечего.
  Future<bool> removeTeam({
    required String competitionId,
    required String teamId,
  }) async {
    final done = await _mutate<bool>(() async {
      await _competitions.deleteTeam(
        competitionId: competitionId,
        teamId: teamId,
      );
      return true;
    });
    return done ?? false;
  }

  /// Общая оболочка «занят → действие → ошибка → свободен».
  ///
  /// `null` в ответе означает «не вышло», а причину страница берёт из `error`:
  /// там русские тексты сервера («Такая запись уже существует», «Недостаточно
  /// прав»), переводить которые на клиенте не нужно.
  Future<T?> _mutate<T>(Future<T?> Function() action) async {
    if (isLoading) return null;
    isLoading = true;
    error = null;
    notifyListeners();
    T? result;
    try {
      result = await action();
    } on Exception catch (e) {
      error = failureMessage(e);
      result = null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
    return result;
  }
}
