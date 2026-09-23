/// Контроллер карточки ОДНОГО соревнования (п.2, п.3 ТЗ).
///
/// Почему отдельный контроллер, а поле в списке: карточка живёт своей жизнью.
/// Её перечитывают после подачи заявки, после публикации протокола, после
/// сборки команды, а список турниров при этом менять не нужно.
///
/// Заявка/отзыв живут здесь же не от хорошей жизни: признак «я уже участвую»
/// (`registered`) приходит в этом же ответе, и держать его в двух местах
/// означало бы ловить рассогласование между кнопкой и реальностью.
library;

import 'package:flutter/foundation.dart';

import '../../../entities/competition/competition.dart';
import '../../../entities/registration/registration.dart';
import '../../../shared/utils/utils.dart';

class CompetitionDetailsController extends ChangeNotifier {
  CompetitionDetailsController({
    required this._competitions,
    required this._registrations,
  });

  final CompetitionService _competitions;
  final RegistrationService _registrations;

  String? competitionId;

  /// Всё, что сервер отдаёт по `/api/competitions/{id}`: карточка, заявки,
  /// составы, протокол, флаг участия.
  CompetitionDetail? data;

  bool isLoading = false;

  /// Отдельный флаг для «действия» (подать/отозвать заявку), а не для загрузки.
  /// Разделение нужно UI: при действии карточка остаётся на экране и лишь
  /// кнопка превращается в крутилку, а при загрузке мы показываем спиннер на
  /// весь блок.
  bool isBusy = false;

  String? error;

  Competition? get competition => data?.competition;
  List<Registration> get registrations => data?.registrations ?? const [];
  List<CompetitionTeam> get teams => data?.teams ?? const [];
  List<ProtocolEntry> get results => data?.results ?? const [];
  bool get registered => data?.registered ?? false;

  Future<void> open(String id) async {
    competitionId = id;
    data = null; // старая карточка другого турнира не должна мелькать
    isLoading = true;
    error = null;
    notifyListeners();
    try {
      data = await _competitions.detail(id);
    } on Exception catch (e) {
      error = failureMessage(e);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// Перечитать текущую карточку. После заявки/публикации это единственный
  /// способ увидеть новые данные — сервер считает `registered` и счётчики сам.
  Future<void> refresh() async {
    final id = competitionId;
    if (id == null) return;
    isBusy = true;
    notifyListeners();
    try {
      data = await _competitions.detail(id);
    } on Exception catch (e) {
      error = failureMessage(e);
    } finally {
      isBusy = false;
      notifyListeners();
    }
  }

  /// Подать заявку. true — чтобы страница успела перечитать и свой список
  /// «мои заявки»: про него этот контроллер ничего не знает.
  Future<bool> join() => _act(() => _registrations.register(_id()));

  Future<bool> cancel() => _act(() => _registrations.cancel(_id()));

  String _id() {
    final id = competitionId;
    if (id == null) {
      throw const ServiceFailure('Соревнование не выбрано');
    }
    return id;
  }

  Future<bool> _act(Future<void> Function() action) async {
    if (isBusy) return false;
    isBusy = true;
    error = null;
    notifyListeners();
    var ok = true;
    try {
      await action();
      // Перечитываем карточку: сервер за нас решил «registered», посчитал
      // заявки и (для финала) проверил отбор.
      data = await _competitions.detail(_id());
    } on Exception catch (e) {
      // Здесь важны тексты сервера: «Вы уже зарегистрированы…», «В финал
      // проходят только участники отбора…» — пользователь должен увидеть
      // причину, а не «действие не выполнено».
      error = failureMessage(e);
      ok = false;
    } finally {
      isBusy = false;
      notifyListeners();
    }
    return ok;
  }
}
