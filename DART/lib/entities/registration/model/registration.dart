/// Заявка спортсмена на соревнование (`competitions.Registration` на сервере).
///
/// ГЛАВНОЕ В ЭТОЙ МОДЕЛИ: у заявки НЕТ статуса
/// («подана/подтверждена/отозвана»). В БД сервера заявка — это строка связи
/// `(competition_id, athlete_id)` с временем создания: она либо есть, либо её
/// нет. Отзыв = DELETE, «подтверждения организатором» в модели нет вообще,
/// поэтому и в интерфейсе кнопки «подтвердить» больше нет — врать пользователю
/// мы не будем.
///
/// ФИО, вуз и город приходят вместе с заявкой: организатору список участников
/// нужен читаемым за один запрос.
class Registration {
  const Registration({
    required this.athleteId,
    required this.fullName,
    required this.organization,
    required this.city,
    required this.createdAt,
  });

  /// id спортсмена (= id учётной записи в серверной таблице `users`).
  final String athleteId;

  final String fullName;

  /// Учебное заведение. Называется именно `organization`: так же поле зовётся
  /// в БД и в `PATCH /api/me` (`university` сервер не знает).
  final String organization;

  final String city;
  final DateTime createdAt;

  factory Registration.fromJson(Map<String, dynamic> json) => Registration(
    athleteId: '${json['athlete_id'] ?? ''}',
    fullName: json['full_name'] as String? ?? '',
    organization: json['organization'] as String? ?? '',
    city: json['city'] as String? ?? '',
    createdAt:
        DateTime.tryParse(json['created_at']?.toString() ?? '') ??
        DateTime(1970),
  );

  Map<String, dynamic> toJson() => {
    'athlete_id': int.tryParse(athleteId) ?? athleteId,
    'full_name': fullName,
    'organization': organization,
    'city': city,
    'created_at': createdAt.toIso8601String(),
  };

  @override
  String toString() => '$fullName ($organization, $city)';
}
