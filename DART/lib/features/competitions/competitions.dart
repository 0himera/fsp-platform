/// Barrel-файл фичи `features/competitions`.
///
/// Наружу — два контроллера: список с фильтрами и карточка одного турнира.
/// `show` ограничен намеренно: страницы не должны получить доступ к тому, как
/// контроллеры хранят промежуточные состояния.
library;

export 'model/competition_details_controller.dart'
    show CompetitionDetailsController;
export 'model/competitions_controller.dart' show CompetitionsController;
