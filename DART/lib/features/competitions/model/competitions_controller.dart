/// Контроллер списка соревнований с фильтрами (п.2 ТЗ).
///
/// `features/*/model` — это состояние и логика фичи без виджетов. Экран читает
/// `items`, `isLoading`, `error` и вызывает `load()` / `filterStatus()` /
/// `search()`.
///
/// ФИЛЬТР ДЕЛАЕТ СЕРВЕР (`?status=`, `?q=`), а не список на клиенте: иначе
/// «показать завершённые» означало бы сначала выгрузить всё, а это работает
/// ровно до того момента, как турниров станет много.
library;

import 'package:flutter/foundation.dart';

import '../../../entities/competition/competition.dart';
import '../../../entities/discipline/discipline.dart';
import '../../../shared/utils/utils.dart';

class CompetitionsController extends ChangeNotifier {
  // Имена полей с подчёркиванием, а на месте вызова — коротко:
  // `CompetitionsController(competitions: ..., disciplines: ...)`.
  CompetitionsController({
    required this._competitions,
    required this._disciplines,
  });

  final CompetitionService _competitions;
  final DisciplineService _disciplines;

  List<Competition> items = const [];

  /// Справочник дисциплин нужен, чтобы карточка была читаемой: сервер
  /// передаёт код (`uav`), а человеку понятно название («БПЛА»).
  List<Discipline> disciplines = const [];

  /// null = «все статусы».
  CompetitionStatus? status;
  String query = '';

  bool isLoading = false;
  String? error;

  String disciplineName(String code) {
    for (final discipline in disciplines) {
      if (discipline.code == code) return discipline.name;
    }
    // Неизвестный код показываем как есть: подставлять «Без дисциплины» было
    // бы хуже — так видно, что справочник и данные разошлись.
    return code;
  }

  Competition? byId(String id) {
    for (final competition in items) {
      if (competition.id == id) return competition;
    }
    return null;
  }

  Future<void> load() async {
    if (isLoading) return;
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      // Запросы запускаем ДО await: справочник дисциплин не зависит от
      // фильтра, и ждать его подряд после списка — просто терять секунду.
      final competitions = _competitions.list(status: status, query: query);
      // Справочник меняется редко (его правит организатор), поэтому тянем его
      // один раз за сессию приложения, а не к каждому списку.
      final names = disciplines.isEmpty
          ? _disciplines.list()
          : Future.value(disciplines);
      items = await competitions;
      disciplines = await names;
    } on Exception catch (e) {
      error = failureMessage(e);
      items = const [];
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> filterStatus(CompetitionStatus? value) async {
    if (status == value) return;
    status = value;
    await load();
  }

  /// Поиск по названию. Вызываем по «отправить», а не по каждому нажатию
  /// клавиши: на каждый символ ушёл бы HTTP-запрос к серверу.
  Future<void> search(String text) async {
    query = text.trim();
    await load();
  }

  /// После публикации протокола или изменения карточки счётчики устарели.
  Future<void> refresh() => load();
}
