/// Реализация контракта `AthleteService` поверх реального бэкенда
/// (backend/internal/httpapi/athletes.go, auth.go).
library;

import '../../../shared/api/api.dart';
import 'athlete.dart';
import 'athlete_profile_update.dart';
import 'athlete_rank.dart';
import 'athlete_service.dart';
import 'current_session.dart';
import 'ranking_page.dart';

class AthleteHttpService implements AthleteService {
  AthleteHttpService(this._api);

  final ApiClient _api;

  @override
  Future<CurrentSession> me() async =>
      CurrentSession.fromJson(asJsonObject(await _api.get('/api/me')));

  @override
  Future<Athlete> getById(String athleteId) async => Athlete.fromJson(
    asJsonObject(await _api.get('/api/athletes/$athleteId')),
  );

  @override
  Future<RankingPage> rankings() async =>
      RankingPage.fromJson(asJsonObject(await _api.get('/api/rankings')));

  @override
  Future<CurrentSession> updateProfile(AthleteProfileUpdate update) async {
    final problem = update.validationError;
    if (problem != null) {
      // Отправляем заведомо неверное тело — получим 400 с чужим текстом от
      // сервера. Дешевле проверить границы здесь и не начинать запрос.
      throw ApiFailure(problem, statusCode: 0);
    }
    // Сервер после сохранения сам перечитывает себя и отвечает то же, что /api/me,
    // поэтому второго запроса («а покажи-ка новый профиль») нет.
    return CurrentSession.fromJson(
      asJsonObject(await _api.patch('/api/me', body: update.toJson())),
    );
  }

  @override
  Future<Athlete> setRank(String athleteId, AthleteRank? rank) async {
    // `none` — не «пустота», а осмысленный код: так сервер понимает «разряд
    // снят». Перечислимость проверяет `allowed` в httpapi, и пустая строка туда
    // не входит, поэтому всегда отправляем конкретный код.
    final response = await _api.patch(
      '/api/athletes/$athleteId/rank',
      body: {'rank_code': AthleteRank.toJsonKey(rank)},
    );
    return Athlete.fromJson(asJsonObject(response));
  }
}
