/// Контроллер «мои заявки» (п.2 ТЗ: спортсмен регистрируется на турниры).
///
/// Список даёт сервер одним запросом `GET /api/me/registrations` — он возвращает
/// те же карточки `Competition`, что и обычный список, поэтому склеивать заявки
/// с турнирами на клиенте нечем.
///
/// Подать заявку можно и отсюда, и из карточки турнира
/// (`CompetitionDetailsController`). Методы здесь дублируются сознательно:
/// домашний экран обязан уметь и «быстро записаться», и «отозвать» без
/// перехода в карточку.
library;

import 'package:flutter/foundation.dart';

import '../../../entities/competition/competition.dart';
import '../../../entities/registration/registration.dart';
import '../../../shared/utils/utils.dart';

class RegistrationController extends ChangeNotifier {
  RegistrationController({required this._registrations});

  final RegistrationService _registrations;

  List<Competition> mine = const [];
  bool isLoading = false;
  String? error;

  Future<void> load() async {
    if (isLoading) return;
    isLoading = true;
    error = null;
    notifyListeners();
    await _fetch();
    isLoading = false;
    notifyListeners();
  }

  /// Чтение без управления флагом загрузки: нужно и `load()`, и `_act()`,
  /// который уже держит `isLoading = true`. Если бы список перечитывался через
  /// `load()`, сработала бы блокировка «мы уже заняты», и список остался бы
  /// старым — ровно тот баг, который прячется за такими блокировками.
  Future<void> _fetch() async {
    try {
      mine = await _registrations.mine();
    } on Exception catch (e) {
      error = failureMessage(e);
      mine = const [];
    }
  }

  /// true в ответе означает «данные изменились» — страница перечитает и этот
  /// список, и карточку, если она открыта.
  Future<bool> join(String competitionId) =>
      _act(() => _registrations.register(competitionId));

  Future<bool> cancel(String competitionId) =>
      _act(() => _registrations.cancel(competitionId));

  Future<bool> _act(Future<void> Function() action) async {
    if (isLoading) return false;
    isLoading = true;
    error = null;
    notifyListeners();
    var ok = true;
    try {
      await action();
      await _fetch();
    } on Exception catch (e) {
      // Сервер объясняет отказ по-русски («Регистрация закрыта…», «В финал
      // проходят только участники отбора…») — переводить не нужно.
      error = failureMessage(e);
      ok = false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
    return ok;
  }
}
