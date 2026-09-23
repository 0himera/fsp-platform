/// Barrel-файл слайса `shared/api` — единственная дверь в HTTP-слой.
///
/// Наружу отдаём только клиент, конфиг и сессию. Разбор cookie держим внутри:
/// ни один модуль не должен разбирать заголовок Set-Cookie самостоятельно.
library;

export 'api_client.dart';
export 'api_config.dart';
export 'api_failure.dart';
export 'api_json.dart';
export 'session_store.dart';
