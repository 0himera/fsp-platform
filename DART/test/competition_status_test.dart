/// Клиентские правила соревнований: статус, приём заявок, публикация протокола,
/// связка «отбор → финал», валидация формы и протокола.
///
/// Это не «наша логика», а повтор бэкенда: каждое правило сверено с
/// `backend/internal/competitions/service.go` (`validInput`, `Register`,
/// `PublishResults`, `validateProtocol`). Мы предсказываем отказ локально, чтобы
/// не водить пользователя на 400/409, но решение всегда за сервером.
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:fps_app/entities/competition/competition.dart';

/// Условное «сейчас»: 23 сентября 2026, 12:00. Дата фиксирована, иначе тест
/// зависел бы от дня запуска.
final DateTime now = DateTime(2026, 9, 23, 12);

/// Турнир с настраиваемыми статусом, этапом и датами.
Competition competition({
  CompetitionStatus status = CompetitionStatus.open,
  CompetitionStage stage = CompetitionStage.standalone,
  CompetitionFormat format = CompetitionFormat.individual,
  DateTime? startsAt,
  DateTime? endsAt,
  DateTime? deadline,
  String? qualifyingCompetitionId,
  int? qualifyingPlaceLimit,
}) => Competition(
  id: '8',
  title: 'Первенство ДГУ',
  level: CompetitionLevel.rdChampionship,
  disciplineCode: 'algorithmic',
  format: format,
  startsAt: startsAt ?? now.add(const Duration(days: 1)),
  endsAt: endsAt ?? now.add(const Duration(days: 2)),
  registrationDeadline: deadline ?? now.add(const Duration(hours: 6)),
  status: status,
  stage: stage,
  qualifyingCompetitionId: qualifyingCompetitionId,
  qualifyingPlaceLimit: qualifyingPlaceLimit,
);

/// Черновик в форме организатора (то, что уходит в POST/PUT).
CompetitionDraft draft({
  String title = 'Первенство ДГУ',
  CompetitionStatus status = CompetitionStatus.open,
  CompetitionStage stage = CompetitionStage.standalone,
  String? qualifyingCompetitionId,
  int? qualifyingPlaceLimit,
  DateTime? startsAt,
  DateTime? endsAt,
  DateTime? deadline,
}) => CompetitionDraft(
  title: title,
  level: CompetitionLevel.regional,
  disciplineCode: 'algorithmic',
  format: CompetitionFormat.individual,
  startsAt: startsAt ?? now.add(const Duration(days: 1)),
  endsAt: endsAt ?? now.add(const Duration(days: 2)),
  registrationDeadline: deadline ?? now,
  status: status,
  stage: stage,
  qualifyingCompetitionId: qualifyingCompetitionId,
  qualifyingPlaceLimit: qualifyingPlaceLimit,
);

void main() {
  group('ключи справочников', () {
    test('статус разбирается по CHECK-значениям БД', () {
      expect(CompetitionStatus.fromJsonKey('draft'), CompetitionStatus.draft);
      expect(CompetitionStatus.fromJsonKey('open'), CompetitionStatus.open);
      expect(
        CompetitionStatus.fromJsonKey('running'),
        CompetitionStatus.running,
      );
      expect(
        CompetitionStatus.fromJsonKey('completed'),
        CompetitionStatus.completed,
      );
    });

    test('неизвестный статус — «завершено», то есть безопасная сторона', () {
      // Заявку на непонятный турнир подать нельзя. Если бы мы по умолчанию
      // вернули `open`, клиент показал бы кнопку там, где сервер ответил бы 409.
      expect(
        CompetitionStatus.fromJsonKey('archived'),
        CompetitionStatus.completed,
      );
      expect(CompetitionStatus.fromJsonKey(null), CompetitionStatus.completed);
    });

    test('этап: `final` приходит ключом сервера, а не именем', () {
      // Dart-enum называется `finalStage`, потому что `final` — зарезервированное
      // слово; в JSON обязан уходить ровно `final`.
      expect(
        CompetitionStage.fromJsonKey('final'),
        CompetitionStage.finalStage,
      );
      expect(CompetitionStage.finalStage.jsonKey, 'final');
      expect(
        CompetitionStage.fromJsonKey('qualityficaton'),
        CompetitionStage.standalone,
      );
    });

    test(
      'уровень и формат: чужое значение — null, а не «первое попавшееся»',
      () {
        expect(
          CompetitionLevel.fromJsonKey('rd_championship'),
          CompetitionLevel.rdChampionship,
        );
        expect(CompetitionLevel.fromJsonKey('federal'), isNull);
        expect(
          CompetitionFormat.fromJsonKey('pair'),
          isNull,
          reason: 'парного зачёта в сервере нет',
        );
        expect(CompetitionFormat.fromJsonKey('team'), CompetitionFormat.team);
      },
    );
  });

  group('приём заявок', () {
    test('открыт только статус `open` до дедлайна', () {
      expect(competition().isRegistrationOpen(now), isTrue);
    });

    test('момент дедлайна — уже закрыто', () {
      // Сервер: `time.Now().After(deadline)`. Мы строже на один миг и это
      // безопасно: лишний 409 хуже, чем спрятанная за секунду до кнопка.
      final last = now.add(const Duration(hours: 6));
      expect(competition(deadline: last).isRegistrationOpen(last), isFalse);
      expect(
        competition(deadline: last)
            .isRegistrationOpen(last.subtract(const Duration(seconds: 1))),
        isTrue,
      );
    });

    test('черновик, «идёт» и «завершено» заявок не принимают', () {
      for (final status in [
        CompetitionStatus.draft,
        CompetitionStatus.running,
        CompetitionStatus.completed,
      ]) {
        final c = competition(status: status);
        expect(
          c.isRegistrationOpen(now),
          isFalse,
          reason: 'сервер: status != "open" → ErrClosed (${status.jsonKey})',
        );
      }
    });

    test('дата в прошлом при статусе `open` закрывает приём', () {
      // Статус и дата — независимые вещи: организатор мог выставить `open` и
      // проспать срок. Кнопку показывать нельзя.
      final c = competition(deadline: now.subtract(const Duration(days: 1)));
      expect(c.isRegistrationOpen(now), isFalse);
    });
  });

  group('публикация протокола', () {
    test('до старта нельзя', () {
      expect(competition().canPublishResults(now), isFalse);
    });

    test('в момент старта и после — можно', () {
      // Сервер: `if startsAt.After(time.Now()) -> ErrClosed`, всё остальное
      // разрешено.
      expect(
        competition(startsAt: now).canPublishResults(now),
        isTrue,
        reason: 'граница включительно: старт начался',
      );
      expect(
        competition(startsAt: now.subtract(const Duration(hours: 3)))
            .canPublishResults(now),
        isTrue,
      );
    });

    test('завершённый турнир публикуется снова — протокол заменяется', () {
      // Публикация сама ставит `status='completed'`. Если бы здесь мы его
      // запретили, организатор не смог бы исправить опечатку в составе: сервер
      // такого запрета не держит, старая версия уходит в `result_publications`.
      expect(
        competition(
          status: CompetitionStatus.completed,
          startsAt: now.subtract(const Duration(days: 3)),
        ).canPublishResults(now),
        isTrue,
      );
    });
  });

  group('этап и связка «отбор → финал»', () {
    test('переход В финал поля связки не трогает', () {
      final prepared = draft(
        qualifyingCompetitionId: '17',
        qualifyingPlaceLimit: 8,
      );
      final final_ = prepared.copyWithStage(CompetitionStage.finalStage);
      expect(final_.stage, CompetitionStage.finalStage);
      expect(final_.qualifyingCompetitionId, '17');
      expect(final_.qualifyingPlaceLimit, 8);
    });

    test('обратный переход сбрасывает оба поля связки', () {
      // `validInput` требует `(stage == "final") == (qualifying_* != null)`,
      // поэтому остаток id отбора превратил бы сохранение в 400.
      final final_ = draft(
        stage: CompetitionStage.finalStage,
        qualifyingCompetitionId: '17',
        qualifyingPlaceLimit: 8,
      );
      for (final stage in [
        CompetitionStage.standalone,
        CompetitionStage.qualification,
      ]) {
        final reset = final_.copyWithStage(stage);
        expect(reset.stage, stage);
        expect(reset.qualifyingCompetitionId, isNull);
        expect(reset.qualifyingPlaceLimit, isNull);
        expect(reset.title, final_.title, reason: 'остальные поля не теряются');
      }
    });

    test('в JSON у не-финада оба поля null, у финала — числа', () {
      final standalone = draft().toJson();
      expect(standalone['stage'], 'standalone');
      expect(standalone['qualifying_competition_id'], isNull);
      expect(standalone['qualifying_place_limit'], isNull);

      final final_ = draft(
        stage: CompetitionStage.finalStage,
        qualifyingCompetitionId: '17',
        qualifyingPlaceLimit: 8,
      ).toJson();
      expect(final_['stage'], 'final');
      // int64 сервера: строку он не примет.
      expect(final_['qualifying_competition_id'], 17);
      expect(final_['qualifying_place_limit'], 8);
    });
  });

  group('валидация черновика (зеркало validInput)', () {
    test('корректный черновик ошибок не даёт', () {
      expect(draft().validationError, isNull);
    });

    test('название: 3..160 БАЙТ UTF-8 — той же мерой, что Go `len()`', () {
      // Латиница: две буквы — это 2 байта, коротко и серверу, и нам.
      expect(draft(title: 'ab').validationError, contains('3 байт'));
      // Кириллица: «аб» занимает 4 байта, и сервер такое принимает. Считать
      // символами значило бы отвергать валидные названия — живой прогон
      // (`live_api_test.dart`) это и показал.
      expect(draft(title: 'аб').validationError, isNull);
      expect(draft(title: '  аб  ').validationError, isNull);
      // 81 русская буква = 162 байта: «символов» меньше 160, но сервер запрос
      // завернёт — значит и форма обязана его не пустить.
      expect(draft(title: 'а' * 81).validationError, contains('160 байт'));
      expect(draft(title: 'а' * 80).validationError, isNull);
      expect(draft(title: 'a' * 160).validationError, isNull);
      expect(draft(title: 'a' * 161).validationError, contains('160 байт'));
    });

    test('без дисциплины нельзя', () {
      expect(
        CompetitionDraft(
          title: 'Кубок',
          level: CompetitionLevel.regional,
          disciplineCode: '',
          format: CompetitionFormat.individual,
          startsAt: now,
          endsAt: now,
          registrationDeadline: now,
          status: CompetitionStatus.open,
        ).validationError,
        contains('дисциплину'),
      );
    });

    test('статус «завершено» форма не выставляет', () {
      // `completed` ставит только публикация протокола; в `validInput` его нет.
      expect(
        draft(status: CompetitionStatus.completed).validationError,
        contains('после публикации протокола'),
      );
      for (final status in [
        CompetitionStatus.draft,
        CompetitionStatus.open,
        CompetitionStatus.running,
      ]) {
        expect(
          draft(status: status).validationError,
          isNull,
          reason: status.jsonKey,
        );
      }
    });

    test('порядок дат: окончание не раньше начала, дедлайн не позже конца', () {
      expect(
        draft(
          startsAt: now,
          endsAt: now.subtract(const Duration(days: 1)),
        ).validationError,
        contains('раньше начала'),
      );
      expect(
        draft(
          startsAt: now,
          endsAt: now.add(const Duration(days: 1)),
          deadline: now.add(const Duration(days: 2)),
        ).validationError,
        contains('позже окончания'),
      );
      // Границы серверу валидны: `!endsAt.Before(startsAt)` и
      // `!registrationDeadline.After(endsAt)` — равенство не ошибка.
      expect(
        draft(startsAt: now, endsAt: now, deadline: now).validationError,
        isNull,
      );
    });

    test('финал без отбора или без проходного места — ошибка формы', () {
      expect(
        draft(
          stage: CompetitionStage.finalStage,
          qualifyingPlaceLimit: 8,
        ).validationError,
        contains('отборочный турнир'),
      );
      expect(
        draft(
          stage: CompetitionStage.finalStage,
          qualifyingCompetitionId: '17',
        ).validationError,
        contains('Проходное место'),
      );
      // `> 0 && <= 10000` — нуль и 10001 сервер не примет.
      expect(
        draft(
          stage: CompetitionStage.finalStage,
          qualifyingCompetitionId: '17',
          qualifyingPlaceLimit: 0,
        ).validationError,
        contains('от 1 до 10000'),
      );
      expect(
        draft(
          stage: CompetitionStage.finalStage,
          qualifyingCompetitionId: '17',
          qualifyingPlaceLimit: 10001,
        ).validationError,
        contains('от 1 до 10000'),
      );
      expect(
        draft(
          stage: CompetitionStage.finalStage,
          qualifyingCompetitionId: '17',
          qualifyingPlaceLimit: 10000,
        ).validationError,
        isNull,
      );
    });
  });

  group('протокол (зеркало validateProtocol)', () {
    const individual = [
      ProtocolEntry(athleteId: '18', place: 1, scoreText: '6 задач'),
      ProtocolEntry(athleteId: '24', place: 2, scoreText: '5 задач'),
    ];

    test('корректный протокол проходит', () {
      expect(
        protocolError(individual, format: CompetitionFormat.individual),
        isNull,
      );
    });

    test('пустой протокол публикацией не является', () {
      expect(
        protocolError(const [], format: CompetitionFormat.individual),
        contains('пуст'),
      );
    });

    test('место вне диапазона 1..N', () {
      expect(
        protocolError(const [
          ProtocolEntry(athleteId: '18', place: 0),
          ProtocolEntry(athleteId: '24', place: 1),
        ], format: CompetitionFormat.individual),
        contains('от 1 до 2'),
      );
      expect(
        protocolError(const [
          ProtocolEntry(athleteId: '18', place: 3),
          ProtocolEntry(athleteId: '24', place: 1),
        ], format: CompetitionFormat.individual),
        contains('от 1 до 2'),
      );
    });

    test('места не обязаны быть разными: делёж первого — норма', () {
      // ВАЖНО: в `validateProtocol` проверки уникальности мест НЕТ. Сервер
      // разрешает «1» и «1» — спортивный результат может быть равным, и наша
      // локальная проверка не должна это выдумывать.
      expect(
        protocolError(const [
          ProtocolEntry(athleteId: '18', place: 1),
          ProtocolEntry(athleteId: '24', place: 1),
        ], format: CompetitionFormat.individual),
        isNull,
      );
    });

    test('один и тот же участник в двух строках — ошибка', () {
      expect(
        protocolError(const [
          ProtocolEntry(athleteId: '18', place: 1),
          ProtocolEntry(athleteId: '18', place: 2),
        ], format: CompetitionFormat.individual),
        contains('дважды'),
      );
    });

    test('формат турнира диктует вид участника', () {
      // `validateProtocol` проверяет это ВМЕСТЕ с форматом:
      // individual && team_id != 0 → ErrInvalid, и наоборот.
      expect(
        protocolError(const [
          ProtocolEntry(teamId: '3', place: 1),
        ], format: CompetitionFormat.individual),
        contains('СПОРТСМЕНУ'),
      );
      expect(
        protocolError(const [
          ProtocolEntry(athleteId: '18', place: 1),
        ], format: CompetitionFormat.team),
        contains('КОМАНДЕ'),
      );
      expect(
        protocolError(const [
          ProtocolEntry(teamId: '3', place: 1),
        ], format: CompetitionFormat.team),
        isNull,
      );
    });

    test('результат длиннее 200 байт не пройдёт', () {
      expect(
        protocolError([
          ProtocolEntry(athleteId: '18', place: 1, scoreText: 'x' * 201),
        ], format: CompetitionFormat.individual),
        contains('200 байт'),
      );
      // Пробелы считаются: сервер мерит `len(score_text)` по строке как её
      // прислали, и `toPublishJson` отправляет её без обрезки. Старая версия
      // проверки обрезала и потому обещала серверу лишнее.
      expect(
        protocolError([
          ProtocolEntry(
            athleteId: '18',
            place: 1,
            scoreText: '${'x' * 200}   ',
          ),
        ], format: CompetitionFormat.individual),
        contains('200 байт'),
      );
      expect(
        protocolError([
          ProtocolEntry(athleteId: '18', place: 1, scoreText: 'x' * 200),
        ], format: CompetitionFormat.individual),
        isNull,
      );
      // Русская буква весит два байта: сто штук — ровно потолок.
      expect(
        protocolError([
          ProtocolEntry(athleteId: '18', place: 1, scoreText: 'х' * 100),
        ], format: CompetitionFormat.individual),
        isNull,
      );
      expect(
        protocolError([
          ProtocolEntry(athleteId: '18', place: 1, scoreText: 'х' * 101),
        ], format: CompetitionFormat.individual),
        contains('200 байт'),
      );
    });

    test('строка без участника', () {
      expect(
        protocolError(const [
          ProtocolEntry(place: 1),
        ], format: CompetitionFormat.individual),
        contains('нет участника'),
      );
    });
  });
}
