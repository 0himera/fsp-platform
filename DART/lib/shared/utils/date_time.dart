/// Форматирование дат для подписей.
///
/// Пакет `intl` не подключаем: нам нужен один формат (дд.мм.гггг), а intl
/// потянул бы за собой цепочку локалей и инициализацию. Если появятся
/// «сколько осталось дней» и склонения — тогда да, intl оправдан.
library;

/// 5 сентября 2026 -> «05.09.2026». Ведущие нули важны: без них список
/// карточек не выравнивается в колонку дат.
String formatDate(DateTime date) {
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  return '$day.$month.${date.year}';
}

/// Дата с временем — для дедлайна регистрации («25.09.2026, 18:00»).
/// Минуты критичны: дедлайн в 23:59 и в 00:00 — разные сутки для человека.
String formatDateTime(DateTime date) =>
    '${formatDate(date)}, ${date.hour.toString().padLeft(2, "0")}:'
    '${date.minute.toString().padLeft(2, "0")}';
