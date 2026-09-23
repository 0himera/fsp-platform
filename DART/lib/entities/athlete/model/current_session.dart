/// Ответ `GET /api/me` целиком: `{ "user": {...}, "athlete": {...} }`.
///
/// Поле `athlete` ОТСУТСТВУЕТ, если вошёл организатор — сервер добавляет его
/// только для роли `athlete`. Поэтому тип `Athlete?`, и это не «данные могли
/// потеряться», а норма для другой роли.
library;

import 'athlete.dart';
import 'auth_user.dart';

class CurrentSession {
  const CurrentSession({required this.user, this.athlete});

  final AuthUser user;
  final Athlete? athlete;

  factory CurrentSession.fromJson(Map<String, dynamic> json) => CurrentSession(
    user: AuthUser.fromJson(
      (json['user'] as Map?)?.cast<String, dynamic>() ?? const {},
    ),
    athlete: json['athlete'] is Map<String, dynamic>
        ? Athlete.fromJson(json['athlete'] as Map<String, dynamic>)
        : null,
  );

  bool get isOrganizer => user.isOrganizer;
}
