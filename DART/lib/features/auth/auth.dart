/// Barrel-файл фичи `features/auth` — наружу только то, что нужно страницам.
///
/// Внутренности (то, как контроллер ходит в сеть и что держит в полях) скрыты:
/// страница пишет `import '../../features/auth/auth.dart';` и получает
/// готовый контроллер.
library;

export 'model/auth_controller.dart' show AuthController;
