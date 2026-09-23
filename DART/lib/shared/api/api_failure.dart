/// Ошибка HTTP-запроса к бэкенду Федерации.
///
/// Наследуемся от ServiceFailure, а не заводим отдельную ветку обработки:
/// контроллеры уже ловят `on Exception catch (e)` и показывают `e` как текст.
/// Значит, достаточно чтобы у ошибки был человекочитаемый `message` — и
/// русские сообщения сервера (`{"error": "Приём заявок закрыт..."}`) попадают
/// в интерфейс без перевода.
library;

import '../utils/utils.dart';

class ApiFailure extends ServiceFailure {
  const ApiFailure(super.message, {this.statusCode = 0});

  /// Код ответа сервера. 0 — запрос вообще не дошёл (сеть выключена, адрес неверный).
  final int statusCode;

  /// Сессия протухла (30 дней прошли, выход на другом устройстве, сервер
  /// почистил таблицу sessions). UI на это реагирует возвратом на экран входа.
  bool get isUnauthorized => statusCode == 401;

  /// Запрос не прошёл по правам: например, спортсмен дёрнул «админский» метод.
  bool get isForbidden => statusCode == 403;

  @override
  String toString() => message;
}
