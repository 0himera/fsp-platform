/// Barrel-файл страницы `pages/admin`.
///
/// Наружу отдаём только экраны: `AdminPage` — раздел организатора,
/// `CompetitionFormPage` — создание/правка карточки турнира, `ProtocolPage` —
/// публикация результатов. Контроллеры админки видны через `features/admin`.
library;

export 'admin_page.dart' show AdminPage;
export 'competition_form_page.dart' show CompetitionFormPage;
export 'protocol_page.dart' show ProtocolPage;
