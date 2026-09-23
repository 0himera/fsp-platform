/// ВРЕМЕННАЯ фейковая база данных — «сервер в памяти» для офлайн-демо и тестов.
///
/// ЗАЧЕМ ОНА НУЖНА СЕГОДНЯ: настоящее приложение работает с Go-бэкендом из
/// `test-server/fsp-platform`, но показывать продукт без запущенной БД и
/// писать тесты на сетевых заглушках удобнее на mock-режиме. Поэтому mock
/// повторяет НЕ «красивые данные», а ПРАВИЛА сервера: те же коды ответов, те же
/// тексты ошибок (см. handleError в internal/httpapi/server.go), та же формула
/// рейтинга (`entities/rating`) и те же ограничения заявки.
///
/// ЧЕСТНО О СЛОЯХ: по правилам FSD `shared` не должен знать про `entities`.
/// Этот файл — единственное исключение, и оно временно: mock-режим нужен для
/// офлайн-показа и тестов, а вместе с ним удаляются и эта база, и mock-
/// сервисы. Остальная архитектура не поменяется: контроллеры зависят только
/// от контрактов `*_service.dart`.
library;

import 'package:fps_app/entities/athlete/athlete.dart';
import 'package:fps_app/entities/competition/competition.dart';
import 'package:fps_app/entities/discipline/discipline.dart';
import 'package:fps_app/entities/rating/rating.dart';
import 'package:fps_app/entities/registration/registration.dart';
import 'package:fps_app/shared/api/api_failure.dart';

/// Строка «таблицы users»: учётная запись и её роль.
class _Account {
  _Account({
    required this.id,
    required this.email,
    required this.password,
    required this.role,
  });

  final String id;
  final String email;
  final String password;
  final AccountRole role;
}

class MockDatabase {
  MockDatabase._({bool seeded = true}) {
    if (seeded) _seed();
  }

  /// Общий экземпляр: все mock-сервисы работают с одной состоянием, поэтому
  /// турнир, созданный админкой, сразу виден спортсмену.
  static final MockDatabase instance = MockDatabase._();

  /// Изолированная пустая база — для тестов, которым важен только их сценарий.
  factory MockDatabase.empty() => MockDatabase._(seeded: false);

  /// Изолированная база С демо-данными. Нужна тестам интерфейса: общий
  /// `instance` пережил бы сессию между двумя `test(...)` и второй начался бы
  /// уже «входом», а не формой входа.
  factory MockDatabase.demo() => MockDatabase._();

  // --- «таблицы» -------------------------------------------------------------

  /// Ключ — почта в нижнем регистре (сервер нормализует её так же).
  final Map<String, _Account> _accounts = {};

  /// Анкеты-скелеты БЕЗ очков: id спортсмена = id учётной записи (как в БД,
  /// где `athletes.user_id` ссылается на `users.id`).
  final Map<String, Athlete> _profiles = {};

  final Map<String, Competition> _competitions = {};
  final Map<String, List<Registration>> _registrations = {};
  final Map<String, List<CompetitionTeam>> _teams = {};

  /// Опубликованные протоколы: id соревнования -> строки.
  final Map<String, List<ProtocolEntry>> _protocols = {};

  /// Публикации протоколов (аналог таблицы `result_publications`): версия,
  /// предшествовавшая последней. Храним, чтобы демо честно показывало,
  /// что повторная публикация ЗАМЕНИЛА протокол, а не дописала его.
  final Map<String, List<ProtocolEntry>> _previousProtocols = {};

  final List<Discipline> _disciplines = [];

  /// «Сессия» mock-а: id учётной записи. В HTTP-режиме за это отвечает cookie
  /// arena_session, здесь — одна строка памяти.
  String? _sessionId;

  /// Следующий id. Стартует с 1000, а не со 100: сид занимает `1`
  /// (организатор), `11…16` (спортсмены) и `101…108` (турниры), и новый
  /// черновик организатора не должен перезаписать готовый турнир.
  int _sequence = 1000;

  String _nextId() => '${++_sequence}';

  DateTime get _now => DateTime.now();

  // --- доступ к текущему пользователю ---------------------------------------

  _Account? get _sessionAccount {
    final id = _sessionId;
    if (id == null) return null;
    for (final account in _accounts.values) {
      if (account.id == id) return account;
    }
    return null;
  }

  /// Аналог `requireUser`: без сессии — 401 «Войдите в аккаунт», с чужой ролью
  /// — 403 «Недостаточно прав». Тексты совпадают с серверными намеренно:
  /// интерфейс в двух режимах должен вести себя одинаково.
  _Account _require({AccountRole? role}) {
    final account = _sessionAccount;
    if (account == null) {
      throw const ApiFailure('Войдите в аккаунт', statusCode: 401);
    }
    if (role != null && account.role != role) {
      throw const ApiFailure('Недостаточно прав', statusCode: 403);
    }
    return account;
  }

  AuthUser _userOf(_Account account) => AuthUser(
    id: account.id,
    email: account.email,
    role: account.role,
    fullName: _profiles[account.id]?.fullName ?? '',
  );

  // --- авторизация -----------------------------------------------------------

  AuthUser login(String email, String password) {
    final account = _accounts[email.trim().toLowerCase()];
    if (account == null || account.password != password) {
      throw const ApiFailure(
        'Неверная почта или пароль',
        statusCode: 401, // auth.ErrInvalidCredentials
      );
    }
    _sessionId = account.id;
    return _userOf(account);
  }

  AuthUser register({
    required String email,
    required String password,
    required String fullName,
    String organization = '',
    String city = '',
  }) {
    final address = email.trim().toLowerCase();
    final name = fullName.trim();
    // Границы — дословно из httpapi/auth.go: register.
    if (!address.contains('@') ||
        address.length > 254 ||
        password.length < 8 ||
        password.length > 128 ||
        name.length < 2 ||
        name.length > 100 ||
        city.length > 100 ||
        organization.length > 160) {
      throw const ApiFailure(
        'Укажите имя, корректную почту и пароль от 8 символов',
        statusCode: 400,
      );
    }
    if (_accounts.containsKey(address)) {
      throw const ApiFailure(
        'Такая запись уже существует',
        statusCode: 409, // уникальность users.email
      );
    }
    final id = _nextId();
    // Новичок — всегда спортсмен: ролей организатора выдача не умеет
    // (в сервере её заводит только сид из переменных окружения).
    _accounts[address] = _Account(
      id: id,
      email: address,
      password: password,
      role: AccountRole.athlete,
    );
    _profiles[id] = Athlete.profile(
      id: id,
      fullName: name,
      city: city.trim(),
      organization: organization.trim(),
      rank: null,
      disciplineCodes: const [],
    );
    _sessionId = id;
    return _userOf(_accounts[address]!);
  }

  void logout() => _sessionId = null;

  /// Ответ `GET /api/me`: у организатора анкеты спортсмена нет, поэтому
  /// `athlete` отсутствует — и это не ошибка.
  CurrentSession me() {
    final account = _require();
    return CurrentSession(
      user: _userOf(account),
      athlete: account.role == AccountRole.athlete
          ? athleteById(account.id)
          : null,
    );
  }

  CurrentSession updateProfile(AthleteProfileUpdate update) {
    final account = _require(role: AccountRole.athlete);
    final name = update.fullName.trim();
    if (name.length < 2 ||
        name.length > 100 ||
        update.city.length > 100 ||
        update.organization.length > 160 ||
        update.disciplineCodes.length > 5) {
      throw const ApiFailure('Проверьте данные профиля', statusCode: 400);
    }
    // Разряд и рейтинг здесь не трогаем: разряд меняет организатор отдельным
    // эндпоинтом, рейтинг считает сервер.
    _profiles[account.id] = Athlete.profile(
      id: account.id,
      fullName: name,
      city: update.city.trim(),
      organization: update.organization.trim(),
      rank: _profiles[account.id]?.rank,
      disciplineCodes: List.unmodifiable(update.disciplineCodes),
    );
    return me();
  }

  /// Таблица рейтинга — эквивалент `rating.Service.All` + `rankAll`.
  List<Athlete> rankedAthletes() {
    // Строки истории собираются из ОПУБЛИКОВАННЫХ протоколов, как на сервере
    // (`WHERE c.status='completed'`). Черновик с протоколом очков не даст.
    final rows = <String, List<RatingRow>>{};
    final moment = _now;
    for (final competition in _competitions.values) {
      if (competition.status != CompetitionStatus.completed) continue;
      final protocol = _protocols[competition.id] ?? const <ProtocolEntry>[];
      // N — число СТРОК протокола: в командном зачёте это число КОМАНД,
      // и каждый член состава получает одинаковые очки.
      final finishers = protocol.length;
      for (final entry in protocol) {
        final row = RatingRow.from(
          competition: competition,
          entry: entry,
          finishers: finishers,
        );
        for (final athleteId in _entrantsOf(competition.id, entry)) {
          rows.putIfAbsent(athleteId, () => []).add(row);
        }
      }
    }

    final rated = [
      for (final profile in _profiles.values)
        RatingCalculator.calculate(
          profile: profile,
          rows: rows[profile.id] ?? const [],
          asOf: moment,
        ),
    ];
    return RatingCalculator.rankAll(rated);
  }

  /// Кого «принести» в историю за эту строку протокола: одного спортсмена или
  /// весь состав команды.
  List<String> _entrantsOf(String competitionId, ProtocolEntry entry) {
    if (!entry.isTeam) return [entry.athleteId];
    for (final team in _teams[competitionId] ?? const <CompetitionTeam>[]) {
      if (team.id == entry.teamId) {
        return [for (final member in team.members) member.athleteId];
      }
    }
    return const [];
  }

  Athlete athleteById(String athleteId) {
    for (final athlete in rankedAthletes()) {
      if (athlete.id == athleteId) return athlete;
    }
    throw const ApiFailure('Не найдено', statusCode: 404);
  }

  /// Изменение разряда — работа организатора (`PATCH /api/athletes/{id}/rank`).
  Athlete setRank(String athleteId, AthleteRank? rank) {
    _require(role: AccountRole.organizer);
    final profile = _profiles[athleteId];
    if (profile == null) {
      throw const ApiFailure('Не найдено', statusCode: 404);
    }
    _profiles[athleteId] = Athlete.profile(
      id: profile.id,
      fullName: profile.fullName,
      city: profile.city,
      organization: profile.organization,
      rank: rank,
      disciplineCodes: profile.disciplineCodes,
    );
    return athleteById(athleteId);
  }

  // --- соревнования ----------------------------------------------------------

  List<Competition> competitionList({
    CompetitionStatus? status,
    String query = '',
  }) {
    // Черновики видит только организатор — ровно как сервер в competitionList.
    final organizer = _sessionAccount?.role == AccountRole.organizer;
    final search = query.trim().toLowerCase();
    final list = [
      for (final competition in _competitions.values)
        if (organizer || competition.status != CompetitionStatus.draft)
          if (status == null || competition.status == status)
            if (search.isEmpty ||
                competition.title.toLowerCase().contains(search))
              _withCounters(competition),
    ];
    // Порядок как в SQL: `ORDER BY starts_at DESC, id DESC`.
    list.sort((a, b) => b.startsAt.compareTo(a.startsAt));
    return list;
  }

  Competition? _raw(String competitionId) => _competitions[competitionId];

  Competition _withCounters(Competition competition) =>
      competition.copyWithCounters(
        registrationsCount: (_registrations[competition.id] ?? const []).length,
        resultsCount: (_protocols[competition.id] ?? const []).length,
      );

  CompetitionDetail competitionDetail(String competitionId) {
    final competition = _raw(competitionId);
    final isOrganizer = _sessionAccount?.role == AccountRole.organizer;
    // Черновик для постороннего — 404, а не 403: существование плана
    // соревнования публичной информации не подлежит.
    if (competition == null ||
        (competition.status == CompetitionStatus.draft && !isOrganizer)) {
      throw const ApiFailure('Не найдено', statusCode: 404);
    }
    return CompetitionDetail(
      competition: _withCounters(competition),
      registrations: registrationsOf(competitionId),
      teams: List.unmodifiable(_teams[competitionId] ?? const []),
      results: List.unmodifiable(_protocols[competitionId] ?? const []),
      registered: myRegistrationOf(competitionId) != null,
    );
  }

  Competition createCompetition(CompetitionDraft draft) {
    _require(role: AccountRole.organizer);
    final problem = draft.validationError;
    if (problem != null) {
      throw ApiFailure(problem, statusCode: 400);
    }
    final id = _nextId();
    _competitions[id] = _applyDraft(
      Competition(
        id: id,
        title: draft.title.trim(),
        level: draft.level,
        disciplineCode: draft.disciplineCode,
        format: draft.format,
        startsAt: draft.startsAt,
        endsAt: draft.endsAt,
        registrationDeadline: draft.registrationDeadline,
        status: draft.status,
        stage: draft.stage,
        qualifyingCompetitionId: draft.qualifyingCompetitionId,
        qualifyingPlaceLimit: draft.qualifyingPlaceLimit,
        location: draft.location.trim(),
        description: draft.description.trim(),
      ),
      draft,
    );
    return _withCounters(_competitions[id]!);
  }

  Competition updateCompetition(String competitionId, CompetitionDraft draft) {
    _require(role: AccountRole.organizer);
    final existing = _raw(competitionId);
    if (existing == null) throw const ApiFailure('Не найдено', statusCode: 404);
    if (existing.status == CompetitionStatus.completed) {
      // Сервер в этом случае не находит строку для UPDATE и отвечает 409:
      // опубликованный протокол «пережечь» правкой карточки нельзя.
      throw const ApiFailure(
        'Регистрация закрыта или действие недоступно',
        statusCode: 409,
      );
    }
    final problem = draft.validationError;
    if (problem != null) throw ApiFailure(problem, statusCode: 400);
    _competitions[competitionId] = _applyDraft(
      Competition(
        id: competitionId,
        title: draft.title.trim(),
        level: draft.level,
        disciplineCode: draft.disciplineCode,
        format: draft.format,
        startsAt: draft.startsAt,
        endsAt: draft.endsAt,
        registrationDeadline: draft.registrationDeadline,
        status: draft.status,
        stage: draft.stage,
        qualifyingCompetitionId: draft.qualifyingCompetitionId,
        qualifyingPlaceLimit: draft.qualifyingPlaceLimit,
        location: draft.location.trim(),
        description: draft.description.trim(),
        registrationsCount: existing.registrationsCount,
        resultsCount: existing.resultsCount,
      ),
      draft,
    );
    return _withCounters(_competitions[competitionId]!);
  }

  /// Правила связки «отбор → финал» из `validateQualifier`: финал обязан
  /// ссылаться на отбор того же формата и дисциплины, закончившийся до его
  /// старта. Возвращает текст ошибки или null.
  String? _qualifierProblem(Competition competition) {
    if (competition.stage != CompetitionStage.finalStage) return null;
    final qualifierId = competition.qualifyingCompetitionId;
    final limit = competition.qualifyingPlaceLimit ?? 0;
    if (qualifierId == null) return 'Финалу нужен отборочный турнир';
    if (limit < 1 || limit > 10000) return 'Проходное место — от 1 до 10000';
    final qualifier = _raw(qualifierId);
    if (qualifier == null) return 'Отборочный турнир не найден';
    if (qualifier.stage != CompetitionStage.qualification) {
      return 'Связывать финал можно только с турниром этапа «отбор»';
    }
    if (qualifier.format != competition.format ||
        qualifier.disciplineCode != competition.disciplineCode) {
      return 'Отбор и финал должны быть одной дисциплины и одного формата';
    }
    if (qualifier.endsAt.isAfter(competition.startsAt)) {
      return 'Отбор должен закончиться до старта финала';
    }
    return null;
  }

  Competition _applyDraft(Competition created, CompetitionDraft draft) {
    final problem = _qualifierProblem(created);
    if (problem != null) {
      throw ApiFailure(problem, statusCode: 400); // competitions.ErrInvalid
    }
    return created;
  }

  /// Публикация протокола (аналог `PublishResults`): полностью заменяет
  /// результаты, ставит статус «завершено» и «отматывает» даты назад, чтобы
  /// дедлайн и окончание не выглядели будущими.
  CompetitionDetail publishProtocol({
    required String competitionId,
    required List<ProtocolEntry> protocol,
  }) {
    _require(role: AccountRole.organizer);
    final competition = _raw(competitionId);
    if (competition == null) {
      throw const ApiFailure('Не найдено', statusCode: 404);
    }
    if (competition.startsAt.isAfter(_now)) {
      throw const ApiFailure(
        'Регистрация закрыта или действие недоступно',
        statusCode: 409, // ErrClosed: публиковать до старта нельзя
      );
    }
    if (competition.stage == CompetitionStage.qualification &&
        _finalsOf(competitionId).any((child) => hasRegistrations(child.id))) {
      throw const ApiFailure(
        'Регистрация закрыта или действие недоступно',
        statusCode: 409,
      );
    }
    final problem = protocolError(protocol, format: competition.format);
    if (problem != null) throw ApiFailure(problem, statusCode: 400);
    // Тот же порядок, что в validInput/validateProtocol: только разрешённый
    // зачёт и только те участники, кто реально в списке.
    for (final entry in protocol) {
      final allowed = competition.isTeam
          ? (_teams[competitionId] ?? const []).any((t) => t.id == entry.teamId)
          : myRegistrationOf(competitionId, athleteId: entry.athleteId) != null;
      if (!allowed) {
        throw const ApiFailure(
          'Проверьте данные соревнования и протокола',
          statusCode: 400,
        );
      }
    }

    _previousProtocols[competitionId] = List.of(
      _protocols[competitionId] ?? const [],
    );
    _protocols[competitionId] = List.unmodifiable(protocol);

    final moment = _now;
    _competitions[competitionId] = Competition(
      id: competition.id,
      title: competition.title,
      level: competition.level,
      disciplineCode: competition.disciplineCode,
      format: competition.format,
      startsAt: competition.startsAt,
      // ends_at = LEAST(ends_at, now()): опубликованный турнир не «в будущем».
      endsAt: competition.endsAt.isAfter(moment) ? moment : competition.endsAt,
      registrationDeadline: competition.registrationDeadline.isAfter(moment)
          ? moment
          : competition.registrationDeadline,
      status: CompetitionStatus.completed,
      stage: competition.stage,
      qualifyingCompetitionId: competition.qualifyingCompetitionId,
      qualifyingPlaceLimit: competition.qualifyingPlaceLimit,
      location: competition.location,
      description: competition.description,
    );
    return competitionDetail(competitionId);
  }

  /// Протокол, который публикация ЗАМЕНИЛА (для подсказки в админке).
  List<ProtocolEntry> previousProtocol(String competitionId) =>
      List.unmodifiable(_previousProtocols[competitionId] ?? const []);

  List<Competition> _finalsOf(String qualifierId) => [
    for (final competition in _competitions.values)
      if (competition.qualifyingCompetitionId == qualifierId) competition,
  ];

  bool hasRegistrations(String competitionId) =>
      (_registrations[competitionId] ?? const []).isNotEmpty;

  // --- заявки ----------------------------------------------------------------

  List<Registration> registrationsOf(String competitionId) =>
      List.unmodifiable(_registrations[competitionId] ?? const []);

  Registration? myRegistrationOf(String competitionId, {String? athleteId}) {
    final id = athleteId ?? _sessionAccount?.id;
    if (id == null) return null;
    for (final registration in _registrations[competitionId] ?? const []) {
      if (registration.athleteId == id) return registration;
    }
    return null;
  }

  List<Competition> myRegistrations() {
    final account = _require(role: AccountRole.athlete);
    final list = [
      for (final entry in _registrations.entries)
        for (final registration in entry.value)
          if (registration.athleteId == account.id)
            _withCounters(_competitions[entry.key]!),
    ];
    list.sort((a, b) => b.startsAt.compareTo(a.startsAt));
    return list;
  }

  /// Подать заявку (аналог POST /api/competitions/{id}/register). Имя не
  /// `register`, чтобы не сталкиваться с `register` регистрации аккаунта.
  void joinCompetition(String competitionId) {
    final account = _require(role: AccountRole.athlete);
    final competition = _raw(competitionId);
    if (competition == null) {
      throw const ApiFailure('Не найдено', statusCode: 404);
    }
    if (competition.status != CompetitionStatus.open ||
        !_now.isBefore(competition.registrationDeadline)) {
      throw const ApiFailure(
        'Регистрация закрыта или действие недоступно',
        statusCode: 409,
      );
    }
    if (myRegistrationOf(competitionId, athleteId: account.id) != null) {
      throw const ApiFailure(
        'Вы уже зарегистрированы или участник включён в команду',
        statusCode: 409,
      );
    }
    if (competition.isGatedFinal && !_qualifiedFor(account.id, competition)) {
      throw const ApiFailure(
        'В финал проходят только участники отбора в пределах проходного места',
        statusCode: 403, // ErrNotQualified
      );
    }
    (_registrations[competitionId] ??= []).add(
      Registration(
        athleteId: account.id,
        fullName: _profiles[account.id]!.fullName,
        organization: _profiles[account.id]!.organization,
        city: _profiles[account.id]!.city,
        createdAt: _now,
      ),
    );
  }

  /// Допущен ли спортсмен в финал: у него есть опубликованное место в отборе
  /// не хуже проходного (своё или в составе команды).
  bool _qualifiedFor(String athleteId, Competition gated) {
    final qualifierId = gated.qualifyingCompetitionId;
    final limit = gated.qualifyingPlaceLimit ?? 0;
    if (qualifierId == null) return false;
    if (_raw(qualifierId)?.status != CompetitionStatus.completed) return false;
    for (final entry in _protocols[qualifierId] ?? const <ProtocolEntry>[]) {
      if (entry.place > limit) continue;
      if (_entrantsOf(qualifierId, entry).contains(athleteId)) return true;
    }
    return false;
  }

  void cancel(String competitionId) {
    final account = _require(role: AccountRole.athlete);
    final competition = _raw(competitionId);
    final mine = myRegistrationOf(competitionId, athleteId: account.id);
    // Серверный DELETE с такими же условиями: приём открыт, срок не истёк,
    // спортсмен не в команде. Не совпало — 409, а не «тихий успех».
    if (competition == null ||
        mine == null ||
        competition.status != CompetitionStatus.open ||
        !competition.registrationDeadline.isAfter(_now) ||
        _inTeam(competitionId, account.id)) {
      throw const ApiFailure(
        'Регистрация закрыта или действие недоступно',
        statusCode: 409,
      );
    }
    _registrations[competitionId]!.remove(mine);
  }

  bool _inTeam(String competitionId, String athleteId) {
    for (final team in _teams[competitionId] ?? const <CompetitionTeam>[]) {
      if (team.members.any((m) => m.athleteId == athleteId)) return true;
    }
    return false;
  }

  // --- команды ---------------------------------------------------------------

  CompetitionTeam createTeam({
    required String competitionId,
    required String name,
    required List<String> memberAthleteIds,
  }) {
    _require(role: AccountRole.organizer);
    final competition = _raw(competitionId);
    if (competition == null) {
      throw const ApiFailure('Не найдено', statusCode: 404);
    }
    final trimmed = name.trim();
    if (trimmed.isEmpty ||
        trimmed.length > 100 ||
        memberAthleteIds.isEmpty ||
        memberAthleteIds.toSet().length != memberAthleteIds.length) {
      throw const ApiFailure(
        'Проверьте данные соревнования и протокола',
        statusCode: 400,
      );
    }
    if (!competition.isTeam ||
        competition.status == CompetitionStatus.completed) {
      throw const ApiFailure(
        'Регистрация закрыта или действие недоступно',
        statusCode: 409,
      );
    }
    final members = <Registration>[];
    for (final athleteId in memberAthleteIds) {
      final registration = myRegistrationOf(
        competitionId,
        athleteId: athleteId,
      );
      if (registration == null) {
        // «athlete is not registered» на сервере = ErrInvalid = 400.
        throw const ApiFailure(
          'Проверьте данные соревнования и протокола',
          statusCode: 400,
        );
      }
      members.add(registration);
    }
    final team = CompetitionTeam(
      id: _nextId(),
      name: trimmed,
      members: List.unmodifiable(members),
    );
    (_teams[competitionId] ??= []).add(team);
    return team;
  }

  void deleteTeam({required String competitionId, required String teamId}) {
    _require(role: AccountRole.organizer);
    final competition = _raw(competitionId);
    if (competition == null ||
        competition.status == CompetitionStatus.completed) {
      throw const ApiFailure('Не найдено', statusCode: 404);
    }
    final list = _teams[competitionId];
    final index = list?.indexWhere((t) => t.id == teamId) ?? -1;
    if (index == -1) throw const ApiFailure('Не найдено', statusCode: 404);
    list!.removeAt(index);
  }

  // --- справочник дисциплин ---------------------------------------------------

  List<Discipline> disciplines() => List.unmodifiable(_disciplines);

  Discipline createDiscipline({required String code, required String name}) {
    _require(role: AccountRole.organizer);
    final trimmed = name.trim();
    final pattern = RegExp(r'^[a-z][a-z0-9_]{1,31}$');
    if (!pattern.hasMatch(code) || trimmed.length < 3 || trimmed.length > 120) {
      throw const ApiFailure(
        'Проверьте код и название дисциплины',
        statusCode: 400,
      );
    }
    if (_disciplines.any((d) => d.code == code)) {
      throw const ApiFailure('Такая запись уже существует', statusCode: 409);
    }
    final discipline = Discipline(code: code, name: trimmed);
    _disciplines.add(discipline);
    return discipline;
  }

  Discipline renameDiscipline({required String code, required String name}) {
    _require(role: AccountRole.organizer);
    final trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 120) {
      throw const ApiFailure('Проверьте название дисциплины', statusCode: 400);
    }
    final index = _disciplines.indexWhere((d) => d.code == code);
    if (index == -1) throw const ApiFailure('Не найдено', statusCode: 404);
    final renamed = Discipline(code: code, name: trimmed);
    _disciplines[index] = renamed;
    return renamed;
  }

  // ---------------------------------------------------------------------- сиды

  void _seed() {
    // Справочник дисциплин — как в таблице `disciplines` после миграции 003.
    _disciplines.addAll(const [
      Discipline(code: 'algorithmic', name: 'Алгоритмическое программирование'),
      Discipline(code: 'product', name: 'Продуктовое программирование'),
      Discipline(
        code: 'security',
        name: 'Программирование систем информационной безопасности',
      ),
      Discipline(code: 'robotics', name: 'Программирование робототехники'),
      Discipline(
        code: 'uav',
        name: 'Программирование беспилотных авиационных систем',
      ),
    ]);

    // Учётки совпадают с демодоступами README сервера, чтобы переключатель
    // mock/HTTP не требовал помнить два набора паролей.
    final organizer = _Account(
      id: '1',
      email: 'organizer@arena.local',
      password: 'change-me-for-local-demo',
      role: AccountRole.organizer,
    );
    _accounts[organizer.email] = organizer;

    const athletes = [
      ('athlete1@arena.local', 'Тагир Гулиев', 'ДГУ', 'Махачкала', 'III'),
      ('athlete2@arena.local', 'Арсен Муртазалиев', 'ДГУ', 'Дербент', 'II'),
      ('athlete3@arena.local', 'Марат Османов', 'ИТМО', 'Санкт-Петербург', 'I'),
      ('athlete4@arena.local', 'Камиль Абдулаев', 'ДГУ', 'Каспийск', 'KMS'),
      ('athlete5@arena.local', 'Заур Кахриманов', 'МФТИ', 'Долгопрудный', 'MS'),
      ('athlete6@arena.local', 'Аминат Шахбанова', 'ДГУ', 'Буйнакск', 'none'),
    ];
    final password = 'demo-athlete-2026';
    // Id спортсменов — 11…16: именно их переписывает сид заявок и протоколов
    // ниже, поэтому сдвиг на единицу ронял сид на `_profiles[id]!`.
    var athleteSeq = 10;
    for (final (email, name, organization, city, rankCode) in athletes) {
      final athleteId = '${++athleteSeq}';
      _accounts[email] = _Account(
        id: athleteId,
        email: email,
        password: password,
        role: AccountRole.athlete,
      );
      _profiles[athleteId] = Athlete.profile(
        id: athleteId,
        fullName: name,
        city: city,
        organization: organization,
        rank: AthleteRank.fromJsonKey(rankCode),
        // Две дисциплины из справочника: «несколько направлений» — норма,
        // и фильтру по ним есть что показать.
        disciplineCodes: const ['algorithmic', 'security'],
      );
    }

    final now = _now;

    void add(Competition competition) {
      _competitions[competition.id] = competition;
      _registrations[competition.id] = [];
      _teams[competition.id] = [];
      _protocols[competition.id] = [];
    }

    // 1. Завершённый региональный турнир с протоколом — чтобы рейтинг был
    // ненулевым сразу, а не пустой таблицей.
    add(
      Competition(
        id: '101',
        title: 'Первенство Дагестана по алгоритмам',
        level: CompetitionLevel.rdChampionship,
        disciplineCode: 'algorithmic',
        format: CompetitionFormat.individual,
        startsAt: now.subtract(const Duration(days: 40)),
        endsAt: now.subtract(const Duration(days: 40)),
        registrationDeadline: now.subtract(const Duration(days: 45)),
        status: CompetitionStatus.completed,
        stage: CompetitionStage.standalone,
        location: 'Махачкала',
        description: 'Личный зачёт, 5 часов, 8 задач.',
      ),
    );
    _registrations['101']!.addAll(
      _seedRegistrations('101', const [
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
      ], now),
    );
    _protocols['101'] = const [
      ProtocolEntry(
        athleteId: '15',
        place: 1,
        scoreText: '7 задач',
        name: 'Заур Кахриманов',
      ),
      ProtocolEntry(
        athleteId: '13',
        place: 2,
        scoreText: '6 задач',
        name: 'Марат Османов',
      ),
      ProtocolEntry(
        athleteId: '14',
        place: 3,
        scoreText: '5 задач',
        name: 'Камиль Абдулаев',
      ),
      ProtocolEntry(
        athleteId: '11',
        place: 4,
        scoreText: '4 задачи',
        name: 'Тагир Гулиев',
      ),
      ProtocolEntry(
        athleteId: '12',
        place: 5,
        scoreText: '3 задачи',
        name: 'Арсен Муртазалиев',
      ),
      // Последнее место: при N=6 коэффициент (N−p)/(N−1) даёт 0 очков —
      // ровно тот случай, который стоит объяснить в интерфейсе.
      ProtocolEntry(
        athleteId: '16',
        place: 6,
        scoreText: '2 задачи',
        name: 'Аминат Шахбанова',
      ),
    ];

    // 2. Отбор (этап «отбор») — очки не даёт, но открывает финал ниже.
    add(
      Competition(
        id: '102',
        title: 'Отбор на Всероссийский турнир · Безопасность',
        level: CompetitionLevel.allRussian,
        disciplineCode: 'security',
        format: CompetitionFormat.individual,
        startsAt: now.subtract(const Duration(days: 10)),
        endsAt: now.subtract(const Duration(days: 10)),
        registrationDeadline: now.subtract(const Duration(days: 14)),
        status: CompetitionStatus.completed,
        stage: CompetitionStage.qualification,
        location: 'Онлайн',
        description: 'Проходят первые трое.',
      ),
    );
    _registrations['102']!.addAll(
      _seedRegistrations('102', const ['11', '12', '13', '14'], now),
    );
    _protocols['102'] = const [
      ProtocolEntry(
        athleteId: '12',
        place: 1,
        scoreText: '1400 баллов',
        name: 'Арсен Муртазалиев',
      ),
      ProtocolEntry(
        athleteId: '13',
        place: 2,
        scoreText: '1320 баллов',
        name: 'Марат Османов',
      ),
      ProtocolEntry(
        athleteId: '14',
        place: 3,
        scoreText: '1290 баллов',
        name: 'Камиль Абдулаев',
      ),
      ProtocolEntry(
        athleteId: '11',
        place: 4,
        scoreText: '1100 баллов',
        name: 'Тагир Гулиев',
      ),
    ];

    // 3. Финал того же отбора: заявка закрыта для тех, кто не прошёл топ-3.
    add(
      Competition(
        id: '103',
        title: 'Финал Всероссийского турнира · Безопасность',
        level: CompetitionLevel.allRussian,
        disciplineCode: 'security',
        format: CompetitionFormat.individual,
        startsAt: now.add(const Duration(days: 12)),
        endsAt: now.add(const Duration(days: 12, hours: 6)),
        registrationDeadline: now.add(const Duration(days: 9)),
        status: CompetitionStatus.open,
        stage: CompetitionStage.finalStage,
        qualifyingCompetitionId: '102',
        qualifyingPlaceLimit: 3,
        location: 'Москва',
        description: 'Доступ только по результату отбора.',
      ),
    );

    // 4. Открытый региональный — основной сценарий «подать заявку».
    add(
      Competition(
        id: '104',
        title: 'Кубок ДГУ по продуктовому программированию',
        level: CompetitionLevel.regional,
        disciplineCode: 'product',
        format: CompetitionFormat.individual,
        startsAt: now.add(const Duration(days: 20)),
        endsAt: now.add(const Duration(days: 20, hours: 5)),
        registrationDeadline: now.add(const Duration(days: 17)),
        status: CompetitionStatus.open,
        stage: CompetitionStage.standalone,
        location: 'Махачкала, ДГУ',
        description: 'Личный зачёт, кейсы от индустриальных партнёров.',
      ),
    );
    _registrations['104']!.add(
      _seedRegistrations('104', const ['11'], now).first,
    );

    // 5. Командный турнир с готовым составом: демонстрирует п.4 сценария
    // сервера (команды собираются из зарегистрированных).
    add(
      Competition(
        id: '105',
        title: 'Командный кубок Дагестана по БПЛА',
        level: CompetitionLevel.rdChampionship,
        disciplineCode: 'uav',
        format: CompetitionFormat.team,
        startsAt: now.add(const Duration(days: 30)),
        endsAt: now.add(const Duration(days: 30, hours: 8)),
        registrationDeadline: now.add(const Duration(days: 25)),
        status: CompetitionStatus.open,
        stage: CompetitionStage.standalone,
        location: 'Каспийск',
        description: 'Команды по 2–3 человека, симулятор полёта.',
      ),
    );
    _registrations['105']!.addAll(
      _seedRegistrations('105', const ['12', '13', '14'], now),
    );
    _teams['105']!.add(
      CompetitionTeam(
        id: '106',
        name: 'Каспий-Дрон',
        members: List.unmodifiable(
          _registrations['105']!.where((r) => r.athleteId != '14').toList(),
        ),
      ),
    );

    // 6. Идёт соревнование: статус running, протокола ещё нет.
    add(
      Competition(
        id: '107',
        title: 'Межрегиональный раунд по робототехнике',
        level: CompetitionLevel.interregional,
        disciplineCode: 'robotics',
        format: CompetitionFormat.individual,
        startsAt: now.subtract(const Duration(hours: 6)),
        endsAt: now.add(const Duration(days: 1)),
        registrationDeadline: now.subtract(const Duration(days: 3)),
        status: CompetitionStatus.running,
        stage: CompetitionStage.standalone,
        location: 'Грозный',
        description: 'Площадки трёх регионов.',
      ),
    );

    // 7. Черновик организатора: спортсмены его не видят ни в списке, ни
    // в карточке — ровно как в competitionList/competitionDetail сервера.
    add(
      Competition(
        id: '108',
        title: 'Черновик: весенний отбор 2027',
        level: CompetitionLevel.regional,
        disciplineCode: 'algorithmic',
        format: CompetitionFormat.individual,
        startsAt: now.add(const Duration(days: 200)),
        endsAt: now.add(const Duration(days: 200, hours: 4)),
        registrationDeadline: now.add(const Duration(days: 195)),
        status: CompetitionStatus.draft,
        stage: CompetitionStage.standalone,
        location: 'Дербент',
        description: 'Ещё не опубликован.',
      ),
    );
  }

  /// «Заявки» для сидов: ФИО/вуз/город берутся из анкеты, как это делает
  /// серверный JOIN registrations ⨝ athletes.
  List<Registration> _seedRegistrations(
    String competitionId,
    List<String> athleteIds,
    DateTime createdBefore,
  ) => [
    for (final id in athleteIds)
      Registration(
        athleteId: id,
        fullName: _profiles[id]!.fullName,
        organization: _profiles[id]!.organization,
        city: _profiles[id]!.city,
        createdAt: createdBefore.subtract(const Duration(days: 1)),
      ),
  ];
}
