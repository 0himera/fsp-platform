/// Barrel-файл слоя `shared/ui`.
///
/// Все переиспользуемые виджеты наружу — через этот файл.
/// Пример импорта в фичах: `import '../../shared/ui/ui.dart';`
library;

// Пока два примитива; с ростом дизайн-системы добавляем новые export здесь.
export 'app_button.dart' show AppButton;
export 'empty_notice.dart' show EmptyNotice;
