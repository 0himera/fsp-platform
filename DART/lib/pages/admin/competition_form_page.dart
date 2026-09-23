/// Форма турнира: создание и правка карточки организатором (п.5 ТЗ).
///
/// Форма собирает `CompetitionDraft`, а НЕ `Competition`: сервер раскодирует
/// тело строго (`DisallowUnknownFields`) и отклонит запрос с лишними ключами
/// вроде `id` или `registrations_count`. Поэтому read-модель здесь только
/// источник начальных значений (`CompetitionDraft.from`), а уходит на сервер
/// write-модель.
///
/// Полей «завершён» нет намеренно: статус `completed` ставит сервер, когда
/// опубликован протокол.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../entities/competition/competition.dart';
import '../../features/admin/admin.dart';
import '../../features/competitions/competitions.dart';
import '../../shared/ui/ui.dart';
import '../../shared/utils/text_bytes.dart';

class CompetitionFormPage extends StatefulWidget {
  const CompetitionFormPage({super.key, this.competition});

  /// null — создаём новый турнир, иначе правим существующий.
  final Competition? competition;

  @override
  State<CompetitionFormPage> createState() => _CompetitionFormPageState();
}

class _CompetitionFormPageState extends State<CompetitionFormPage> {
  final _formKey = GlobalKey<FormState>();

  late final _title = TextEditingController(
    text: widget.competition?.title ?? '',
  );
  late final _location = TextEditingController(
    text: widget.competition?.location ?? '',
  );
  late final _description = TextEditingController(
    text: widget.competition?.description ?? '',
  );
  late final _placeLimit = TextEditingController(
    text: widget.competition?.qualifyingPlaceLimit?.toString() ?? '',
  );

  late CompetitionDraft _draft = widget.competition == null
      ? CompetitionDraft(
          title: '',
          level: CompetitionLevel.regional,
          disciplineCode: '',
          format: CompetitionFormat.individual,
          startsAt: DateTime.now().add(const Duration(days: 7)),
          endsAt: DateTime.now().add(const Duration(days: 7, hours: 6)),
          registrationDeadline: DateTime.now().add(const Duration(days: 6)),
          status: CompetitionStatus.draft,
        )
      : CompetitionDraft.from(widget.competition!);

  @override
  void dispose() {
    _title.dispose();
    _location.dispose();
    _description.dispose();
    _placeLimit.dispose();
    super.dispose();
  }

  /// Дата + время одним диалогом. `showDatePicker` и `showTimePicker` —
  /// два отдельных экрана: объединяем их, потому что организатору нужна одна
  /// конкретная минута дедлайна, а не «некоторые сутки».
  Future<void> _pick(
    String label,
    DateTime current,
    void Function(DateTime) apply,
  ) async {
    final date = await showDatePicker(
      context: context,
      initialDate: current,
      firstDate: DateTime(current.year - 1),
      lastDate: DateTime(current.year + 5),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(current),
    );
    if (time == null || !mounted) return;
    apply(DateTime(date.year, date.month, date.day, time.hour, time.minute));
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final admin = context.read<AdminController>();
    final saved = await admin.saveCompetition(
      widget.competition?.id,
      _draft.copyWith(
        title: _title.text,
        location: _location.text,
        description: _description.text,
        qualifyingPlaceLimit: int.tryParse(_placeLimit.text),
      ),
    );
    if (!mounted) return;
    if (saved == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(admin.error ?? 'Не вышло')));
      return;
    }
    // Список турниров перечитываем обязательно: у созданного черновика и у
    // правки счётчики и статус считает сервер.
    await context.read<CompetitionsController>().load();
    if (!mounted) return;
    Navigator.of(context).pop(saved);
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminController>();
    final competitions = context.watch<CompetitionsController>().items;
    final isFinal = _draft.stage == CompetitionStage.finalStage;
    // В качестве отбора можно указать только турнир этапа «отбор»: сервер
    // отвержет любую другую связку.
    final qualifiers = [
      for (final competition in competitions)
        if (competition.stage == CompetitionStage.qualification &&
            competition.id != widget.competition?.id)
          competition,
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.competition == null ? 'Новый турнир' : 'Правка турнира',
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(
                labelText: 'Название',
                helperText: 'от 3 до 160 байт (русская буква — 2 байта)',
              ),
              // Байты, а не символы: `validInput` сервера сравнивает
              // `len(title)` со 160, то есть для кириллицы потолок — примерно
              // 80 букв. Ровно это же правило держит и
              // `CompetitionDraft.validationError`.
              validator: (value) {
                final bytes = utf8Length((value ?? '').trim());
                if (bytes < 3) return 'Название — не короче 3 байт';
                if (bytes > 160) return utf8LimitHint('Название', 160);
                return null;
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _draft.disciplineCode.isEmpty
                  ? null
                  : _draft.disciplineCode,
              decoration: const InputDecoration(labelText: 'Дисциплина'),
              items: [
                for (final discipline in admin.disciplines)
                  DropdownMenuItem(
                    value: discipline.code,
                    child: Text('${discipline.name} (${discipline.code})'),
                  ),
              ],
              validator: (value) =>
                  value == null ? 'Выберите дисциплину' : null,
              onChanged: (value) => setState(
                () => _draft = _draft.copyWith(disciplineCode: value ?? ''),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<CompetitionLevel>(
              initialValue: _draft.level,
              decoration: const InputDecoration(labelText: 'Уровень'),
              items: [
                for (final level in CompetitionLevel.values)
                  DropdownMenuItem(value: level, child: Text(level.label)),
              ],
              onChanged: (value) => setState(
                () => _draft = _draft.copyWith(level: value ?? _draft.level),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<CompetitionFormat>(
              initialValue: _draft.format,
              decoration: const InputDecoration(labelText: 'Зачёт'),
              items: [
                for (final format in CompetitionFormat.values)
                  DropdownMenuItem(value: format, child: Text(format.label)),
              ],
              // Смена формата меняет и смысл заявок: сервер не позволит
              // опубликовать протокол «не тех» участников, поэтому
              // предупреждаем организатора сразу.
              onChanged: (value) => setState(
                () => _draft = _draft.copyWith(format: value ?? _draft.format),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<CompetitionStatus>(
              initialValue: _draft.status,
              decoration: const InputDecoration(
                labelText: 'Статус',
                helperText: '«завершено» ставит сервер после протокола',
              ),
              items: [
                for (final status in CompetitionStatus.values)
                  if (status != CompetitionStatus.completed)
                    DropdownMenuItem(value: status, child: Text(status.label)),
              ],
              onChanged: (value) => setState(
                () => _draft = _draft.copyWith(status: value ?? _draft.status),
              ),
            ),
            const SizedBox(height: 16),
            _dateTile(
              'Начало',
              _draft.startsAt,
              (value) => _draft = _draft.copyWith(startsAt: value),
            ),
            _dateTile(
              'Окончание',
              _draft.endsAt,
              (value) => _draft = _draft.copyWith(endsAt: value),
            ),
            _dateTile(
              'Дедлайн заявок',
              _draft.registrationDeadline,
              (value) => _draft = _draft.copyWith(registrationDeadline: value),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<CompetitionStage>(
              initialValue: _draft.stage,
              decoration: const InputDecoration(labelText: 'Этап'),
              items: [
                for (final stage in CompetitionStage.values)
                  DropdownMenuItem(value: stage, child: Text(stage.label)),
              ],
              onChanged: (value) => setState(() {
                final stage = value ?? CompetitionStage.standalone;
                // У не-финала обязательные поля связки должны быть null —
                // так требует сервер.
                _draft = _draft.copyWithStage(stage);
              }),
            ),
            if (isFinal) ...[
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _draft.qualifyingCompetitionId,
                decoration: const InputDecoration(
                  labelText: 'Отборочный турнир',
                ),
                items: [
                  for (final qualifier in qualifiers)
                    DropdownMenuItem(
                      value: qualifier.id,
                      child: Text(qualifier.title),
                    ),
                ],
                validator: (value) => isFinal && value == null
                    ? 'Финалу нужен отборочный турнир'
                    : null,
                onChanged: (value) => setState(
                  () =>
                      _draft = _draft.copyWith(qualifyingCompetitionId: value),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _placeLimit,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Проходное место',
                  helperText: 'от 1 до 10000: попадание в топ-N отбора',
                ),
                validator: (value) {
                  if (!isFinal) return null;
                  final limit = int.tryParse(value ?? '') ?? 0;
                  return limit < 1 || limit > 10000
                      ? 'Проходное место — от 1 до 10000'
                      : null;
                },
              ),
            ],
            const SizedBox(height: 16),
            TextFormField(
              controller: _location,
              decoration: const InputDecoration(labelText: 'Место проведения'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _description,
              minLines: 2,
              maxLines: 5,
              decoration: const InputDecoration(labelText: 'Описание'),
            ),
            const SizedBox(height: 24),
            AppButton(
              text: 'Сохранить',
              onPressed: admin.isLoading ? null : _save,
            ),
            if (admin.isLoading) const LinearProgressIndicator(),
          ],
        ),
      ),
    );
  }

  Widget _dateTile(
    String label,
    DateTime value,
    void Function(DateTime) apply,
  ) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      subtitle: Text(
        '${value.day.toString().padLeft(2, '0')}.'
        '${value.month.toString().padLeft(2, '0')}.'
        '${value.year} ${value.hour.toString().padLeft(2, '0')}:'
        '${value.minute.toString().padLeft(2, '0')}',
      ),
      trailing: IconButton(
        icon: const Icon(Icons.edit_calendar),
        // Обёртка setState здесь, а не в `apply`: выбор даты приходит из
        // диалога асинхронно, и после него виджет обязан перерисоваться.
        onPressed: () =>
            _pick(label, value, (picked) => setState(() => apply(picked))),
      ),
    );
  }
}
