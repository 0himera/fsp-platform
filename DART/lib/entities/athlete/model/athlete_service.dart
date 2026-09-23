/// КОНТРАКТ данных спортсмена (п.1 и п.4 ТЗ).
///
///  • me()           -> GET   /api/me
///  • getById()      -> GET   /api/athletes/{id}
///  • rankings()     -> GET   /api/rankings
///  • updateProfile()-> PATCH /api/me
///  • setRank()      -> PATCH /api/athletes/{id}/rank   (только организатор)
///
/// Заметьте: «спортсмен + его рейтинг» здесь — ОДИН запрос. Сервер считает
/// рейтинг при чтении и кладёт к анкете историю с коэффициентами, поэтому
/// пересчитывать очки на клиенте не нужно (и вредно: ушли бы от таблицы).
library;

import 'athlete.dart';
import 'athlete_profile_update.dart';
import 'athlete_rank.dart';
import 'current_session.dart';
import 'ranking_page.dart';

abstract class AthleteService {
  /// Кто мы сейчас: роль + (для спортсмена) полная анкета с рейтингом.
  Future<CurrentSession> me();

  /// Анкета любого спортсмена вместе с историей выступлений и рейтингом.
  Future<Athlete> getById(String athleteId);

  /// Вся таблица рейтинга — один запрос вместо «N анкет подряд» (п.4 ТЗ).
  Future<RankingPage> rankings();

  /// Правка своей анкеты. Сервер в ответ возвращает тот же пакет, что и `me()`,
  /// поэтому отдельный «перечитать профиль» не нужен.
  Future<CurrentSession> updateProfile(AthleteProfileUpdate update);

  /// Изменить разряд. `null` = «без разряда» -> код `none`.
  /// Историю изменений ведёт сервер (таблица `rank_changes`).
  Future<Athlete> setRank(String athleteId, AthleteRank? rank);
}
