# Клиент Федерации спортивного программирования

Flutter-приложение (Feature-Sliced Design) к бэкенду `test-server/fsp-platform`
(Go + PostgreSQL). **Работает строго с API**: своих данных, демо-базы и
локального состояния у приложения нет — авторизация живёт в HttpOnly-cookie
`arena_session`, которую выдаёт только сервер.

## Запуск

0. Проверить, что `flutter` вообще что-то делает (на Arch это частая ловушка,
   см. раздел «Программа не компилируется»):

   ```bash
   flutter --version   # должна напечатать версию; пусто — команда-обёртка молчит
   ```

1. Поднять бэкенд (подробности — в `test-server/fsp-platform/README.md`):

   ```bash
   docker compose -f test-server/fsp-platform/docker-compose.yml up -d --build
   curl -s http://127.0.0.1:8080/api/health   # {"rating_rules":"arena-2","status":"ok"}
   ```

   Если `api/health` отвечает `404` или connection refused, а контейнер `app`
   показан как `Exited (1)` со строкой `lookup db on 127.0.0.53:53` в логах —
   контейнер пережил пересоздание сети и в неё не попал. `up -d` его только
   «запускает» обратно, сеть не чинит: нужно
   `docker compose -f test-server/fsp-platform/docker-compose.yml up -d --force-recreate app`.

2. Запустить приложение:

   ```bash
   flutter pub get
   flutter run
   ```

Учётные записи — из сида сервера: `organizer@arena.local` /
`change-me-for-local-demo` (организатор) и `athlete1@arena.local` /
`demo-athlete-2026` (спортсмен).

### Адрес сервера

По умолчанию — `http://127.0.0.1:8080`. Переопределяется при сборке
(`--dart-define`, а не переменная окружения: приложение перезапускается, а не
пересобирается):

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080   # Android-эмулятор
flutter run --dart-define=API_BASE_URL=http://192.168.0.10:8080  # телефон по Wi-Fi
```

Именно IP, а не `localhost`: бэкенд слушает IPv4, а `localhost` на некоторых
машинах резолвится в `::1`, и запрос «не доходит», выглядя как обрыв сети.

## «Программа не компилируется»

Код тут обычно ни при чём. На этой машине ломаются две вещи, и обе выглядят
как «приложение не собирается».

### 1. Команды `flutter` и `dart` молча ничего не делают

`/usr/bin/flutter` — это обёртка `/opt/flutter/bin/aur_flutter`: она готовит
окружение и передаёт управление «настоящему» flutter, но только если тот стоит в
`PATH` раньше `/usr/bin`. У арх-пакета `/opt/flutter/bin` добавляется ПОЗЖЕ
`/usr/bin`, поэтому обёртка доходит до своей защиты от рекурсии, видит, что
`which flutter` — это она сама, и выходит **молча с кодом 0**. `flutter run`,
`flutter pub get`, `flutter analyze`, `flutter test` и `flutter build` в таком
состоянии не делают ровно ничего: ничего не проверяется и не собирается, а
терминал выглядит победным.

```bash
flutter --version                      # пусто  →  обёртка молчит
/opt/flutter/bin/flutter --version     # напечатал версию  →  SDK живой
which -a flutter                       # /usr/bin/flutter раньше /opt/flutter/bin/flutter
```

Лечение — поставить SDK в начало `PATH` (строку в `~/.zshrc`, затем `exec zsh`):

```bash
export PATH="/opt/flutter/bin:$PATH"
```

Дальше в этом README команды даны как `flutter ...` — предполагается, что
проверка из шага 0 выше печатает версию. Полный путь работает всегда, если
править `PATH` не хочется.

### 2. Тысячи `Target of URI doesn't exist` в анализаторе

Если IDE сыпет ошибками вида
`Target of URI doesn't exist: 'package:flutter/foundation.dart'` на всех файлах
сразу (и не находит даже `expect`), а тесты при этом проходят — код ни при чём:
`.dart_tool/package_config.json` указывает на Flutter SDK, которого по тому пути
уже нет. Путь туда ведёт через unionfs-оверлей `~/.cache/flutter_sdk`, и когда
тот не смонтирован, конфигурация проекта указывает в пустую папку.

Лечится пересогласованием проекта с текущим SDK (команду брать из шага 0, иначе
она ничего не сделает):

```bash
flutter pub get && flutter analyze   # «No issues found!»
```

После этого анализатор в IDE стоит перезапустить (Restart Analysis Server),
иначе он продолжит держать в памяти старый `package_config.json`.

## Структура

| Слой | Что внутри |
| --- | --- |
| `app` | `main.dart`: сборка `AppServices.http()`, `AuthGate`, тема |
| `shared/api` | `ApiClient`, cookie-сессия, конфиг, `ApiFailure` и разбор ошибок |
| `shared/ui`, `shared/utils` | переиспользуемые виджеты, форматирование дат, байтовая длина строк |
| `entities` | модели и контракты (`*Service`) + HTTP-реализации под реальный JSON |
| `features` | контроллеры (`ChangeNotifier`): auth, competitions, registration, results, rating, admin |
| `pages` | экраны: вход, кабинет, соревнования и карточка, рейтинг, админка |

Правило слоя: `features` и `pages` знают только про абстрактные контракты из
`entities`. Место, где выбирается реализация контрактов, одно — `app`, и выбор
там только один: HTTP.

## Тесты

```bash
flutter test                      # 103 теста, сервер не нужен
flutter test --dart-define=API_LIVE=true test/live_api_test.dart   # против живого бэкенда
```

- `fixtures_test.dart` — разбор реальных ответов, сохранённых с живого сервера,
  и сверка формулы рейтинга arena-2 до сотых.
- `http_api_test.dart` — адреса, тела, cookie, заголовок `Origin`, тексты ошибок.
- `competition_status_test.dart`, `text_bytes_test.dart` — клиентские правила
  один-в-один как в `validInput`, `validateProtocol` и `register`.
- `widget_test.dart` — прохождение по экранам на подменённых сервисах.
- `live_api_test.dart` — дымовой прогон по настоящему HTTP; по умолчанию
  пропускается, чтобы `flutter test` не зависел от Docker.

Моки (`MockDatabase`, `Mock*Service`) лежат в `test/support/mock/`, а не в
`lib/`: в сборку приложения они не попадают и подменить боевой транспорт могут
только внутри теста.

## Про байты вместо символов

Go измеряет длину строк через `len()`, то есть в байтах UTF-8, а Dart — в
кодюнитах UTF-16; русская буква — это 2 байта при одном кодюните. Все лимиты
полей (`title` 3..160, `full_name` 2..100, `city` 100, `organization` 160,
`score_text` 200, название дисциплины 3..120) сервер проверяет по байтам,
поэтому и клиент проверяет их через `utf8Length` (`shared/utils/text_bytes.dart`),
иначе форма либо не пускала бы валидное значение, либо отправляла бы то, что
сервер завернёт.

Даты в запросах отправляются только в UTC (`...Z`): Go раскодирует поле по
RFC 3339, а `toIso8601String()` у локального времени отметку зоны не дописывает —
сервер отвечал `400 parsing time ... cannot parse "" as "Z07:00"`.
