/// КОНТРАКТ работы с заявками (п.2 ТЗ: «спортсмен может зарегистрироваться»).
///
/// Абстрактный класс = обещание. UI и контроллеры зависят от ОБЕЩАНИЯ, а не от
/// того, кто его выполняет: в приложении это HTTP-бэкенд, а в тестах —
/// подмена из `test/support/mock/`.
/// Поэтому подключение сервера не изменило ни одной строки в контроллерах.
///
/// СООТВЕТСТВИЕ ЭНДПОИНТАМ (backend/internal/httpapi):
///  • mine()    -> GET    /api/me/registrations   (список турниров мои заявки)
///  • register() -> POST   /api/competitions/{id}/register
///  • cancel()  -> DELETE /api/competitions/{id}/register
library;

import '../../competition/competition.dart';

abstract class RegistrationService {
  /// Турниры, на которые у меня есть заявка.
  ///
  /// Сервер возвращает те же карточки `Competition`, что и список: нам не нужно
  /// самому склеивать заявки с турнирами.
  Future<List<Competition>> mine();

  /// Подать заявку. Ответ 409 («уже зарегистрированы») и 409/403 («не прошёл
  /// отбор») прилетают исключением с русским сообщением от сервера.
  Future<void> register(String competitionId);

  /// Отозвать заявку. Сервер разрешит это, только пока приём открыт и спортсмен
  /// не включён в команду.
  Future<void> cancel(String competitionId);
}
