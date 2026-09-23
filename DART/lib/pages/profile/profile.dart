/// Barrel-файл слайса `pages/profile`.
///
/// Правило то же, что для entities и features: наружу выходим через barrel.
/// Пока здесь одна страница; когда добавим роуты (`app/router`), они будут
/// импортировать этот файл, а не файл виджета напрямую.
library;

export 'profile_page.dart' show ProfilePage;
