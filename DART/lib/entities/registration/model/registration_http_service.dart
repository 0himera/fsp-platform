/// Реализация контракта `RegistrationService` поверх реального бэкенда.
///
/// Спортсмен нигде не передаёт свой id: сервер берёт его из сессии
/// (`requireUser(..., "athlete")` -> `user.ID`), поэтому запрос короче и
/// подделать «чужую заявку» из клиента нельзя.
library;

import '../../../shared/api/api.dart';
import '../../competition/competition.dart';
import 'registration_service.dart';

class RegistrationHttpService implements RegistrationService {
  RegistrationHttpService(this._api);

  final ApiClient _api;

  @override
  Future<List<Competition>> mine() async {
    final response = await _api.get('/api/me/registrations');
    return [
      for (final item in asJsonList(response)) Competition.fromJson(item),
    ];
  }

  @override
  Future<void> register(String competitionId) async {
    // Тела у запроса нет — только id в пути. 409 «уже зарегистрированы»,
    // 409 «приём закрыт» и 403 «не прошёл отбор» ApiClient превращает
    // в исключение с русским текстом сервера.
    await _api.post('/api/competitions/$competitionId/register');
  }

  @override
  Future<void> cancel(String competitionId) async {
    await _api.delete('/api/competitions/$competitionId/register');
  }
}
