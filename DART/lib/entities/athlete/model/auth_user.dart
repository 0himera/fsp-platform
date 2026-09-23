/// Учётная запись пользователя платформы.
///
/// На сервере «кто вошёл» и «кто такой спортсмен» — РАЗНЫЕ таблицы:
/// `users` (почта, пароль, роль) и `athletes` (анкета, разряд). Поэтому и у нас
/// две модели: эта — про доступ, `Athlete` — про спортивные данные.
/// У организатора анкеты спортсмена нет вообще, и это не частный случай ошибки.
library;

/// Роль приходит из `users.role` (CHECK: 'athlete' | 'organizer').
enum AccountRole {
  athlete('athlete', 'спортсмен'),
  organizer('organizer', 'организатор');

  const AccountRole(this.jsonKey, this.label);

  final String jsonKey;
  final String label;

  /// Неизвестную роль превращаем в `athlete`: у неё меньше прав, значит
  /// случайная ошибка разбора не откроет админку постороннему.
  static AccountRole fromJsonKey(String? raw) {
    for (final role in values) {
      if (role.jsonKey == raw) return role;
    }
    return AccountRole.athlete;
  }
}

class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.role,
    required this.fullName,
  });

  /// id учётной записи: его сервер подставляет вместо `athlete_id` во всех
  /// «моих» запросах (/api/me, /api/me/registrations, register).
  final String id;
  final String email;
  final AccountRole role;

  /// Дублируется из анкеты спортсмена; у организатора обычно пустой.
  final String fullName;

  bool get isOrganizer => role == AccountRole.organizer;
  bool get isAthlete => role == AccountRole.athlete;

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
    id: '${json['id'] ?? ''}',
    email: json['email'] as String? ?? '',
    role: AccountRole.fromJsonKey(json['role'] as String?),
    fullName: json['full_name'] as String? ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id': int.tryParse(id) ?? id,
    'email': email,
    'role': role.jsonKey,
    'full_name': fullName,
  };

  @override
  String toString() => '$email (${role.label})';
}
