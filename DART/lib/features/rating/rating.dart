/// Barrel-файл фичи `features/rating`.
///
/// Формула `arena-2` отсюда НЕ экспортируется: она переехала в `entities/rating`
/// как знание предметной области, а фича — только экран и его состояние.
library;

export 'model/rating_controller.dart' show RatingController;
