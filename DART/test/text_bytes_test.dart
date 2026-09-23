/// Байтовая точность клиентских валидаторов.
///
/// Бэкенд написан на Go, а Go измеряет длину строки через `len()` — то есть в
/// байтах UTF-8. Dart через `String.length` считает кодюниты UTF-16. Пока текст
/// латинский, числа совпадают; на кириллице русская буква весит 2 байта при
/// одном кодюните, и клиент, который проверяет «символы», начинает расходиться
/// с сервером в обе стороны:
///  • пускает то, что сервер завернёт (100 русских букв в «ФИО до 100»);
///  • блокирует то, что сервер принял бы (`аб` — 4 байта, название законно).
///
/// Поэтому все границы полей в клиенте меряются `utf8Length`. Этот файл —
/// страховка, что ни одно правило не вернулось к `.length`.
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:fps_app/entities/athlete/athlete.dart';
import 'package:fps_app/entities/discipline/discipline.dart';
import 'package:fps_app/shared/utils/text_bytes.dart';

void main() {
  group('utf8Length', () {
    test('латиница и цифры — по байту на знак', () {
      expect(utf8Length('abc'), 3);
      expect(utf8Length(''), 0);
    });

    test('кириллица — два байта на букву', () {
      expect(utf8Length('аб'), 4);
      expect(utf8Length('а' * 80), 160);
      expect(utf8Length('а' * 81), 162);
    });

    test('пробелы и эмодзи тоже считаются', () {
      // Пробелы сервер НЕ вырезает там, где меряет `len()` без TrimSpace.
      expect(utf8Length('ab  '), 4);
      // 4-байтный UTF-8 — верхняя граница кодирования.
      expect(utf8Length('a😀'), 5);
    });

    test('непарный суррогат не роняет проверку', () {
      // `\uDE00` — «хвост» пары без «головы»: `utf8.encode` на таком обычно
      // бросает. Валидатор формы падать не имеет права.
      expect(utf8Length('\ude00'), greaterThan(0));
    });
  });

  group('анкета спортсмена (границы auth.go)', () {
    AthleteProfileUpdate profile({
      String fullName = 'Тагир Гулиев',
      String city = 'Махачкала',
      String organization = 'ДГУ',
      List<String> codes = const ['algorithmic'],
    }) => AthleteProfileUpdate(
      fullName: fullName,
      city: city,
      organization: organization,
      disciplineCodes: codes,
    );

    test('корректная анкета ошибок не даёт', () {
      expect(profile().validationError, isNull);
    });

    test('ФИО: минимум 2 байта, а не две буквы подряд', () {
      // Одна русская буква = 2 байта → сервер принимает, и мы тоже.
      expect(profile(fullName: 'Ф').validationError, isNull);
      expect(profile(fullName: ' Ф ').validationError, isNull);
      expect(profile(fullName: 'Ф ').validationError, isNull);
      // Пустое и пробельное значение короче двух байт.
      expect(profile(fullName: '').validationError, contains('ФИО'));
      expect(profile(fullName: '   ').validationError, contains('ФИО'));
    });

    test('ФИО длиннее 100 байт не пройдёт', () {
      expect(profile(fullName: 'а' * 50).validationError, isNull);
      expect(profile(fullName: 'а' * 51).validationError, contains('100 байт'));
      expect(profile(fullName: 'a' * 100).validationError, isNull);
      expect(
        profile(fullName: 'a' * 101).validationError,
        contains('100 байт'),
      );
    });

    test('город — 100 байт, организация — 160', () {
      expect(profile(city: 'а' * 50).validationError, isNull);
      expect(profile(city: 'а' * 51).validationError, contains('Город'));
      expect(profile(organization: 'о' * 80).validationError, isNull);
      expect(
        profile(organization: 'о' * 81).validationError,
        contains('160 байт'),
      );
    });

    test('список дисциплин сервер считает ШТУКАМИ, а не байтами', () {
      // `len(input.Disciplines) > 5` — это длина среза: здесь `.length` у Dart
      // полностью совпадает с Go, и менять меру не нужно.
      expect(
        profile(codes: const ['a1', 'a2', 'a3', 'a4', 'a5']).validationError,
        isNull,
      );
      expect(
        profile(codes: const ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'])
            .validationError,
        contains('5 дисциплин'),
      );
    });
  });

  group('справочник дисциплин (границы disciplines.go)', () {
    test('код: строчная латинская буква, затем 1–31 символ [a-z0-9_]', () {
      expect(disciplineError(code: 'uav', name: 'БПЛА'), isNull);
      expect(disciplineError(code: 'uav_racing2', name: 'БПЛА'), isNull);
      // Один символ — это `{1,31}` не удовлетворяет: код от 2 до 32 знаков.
      expect(disciplineError(code: 'u', name: 'БПЛА'), contains('Код'));
      expect(disciplineError(code: 'a' * 33, name: 'БПЛА'), contains('Код'));
      expect(disciplineError(code: 'Uav', name: 'БПЛА'), contains('Код'));
      expect(disciplineError(code: '9uav', name: 'БПЛА'), contains('Код'));
      expect(disciplineError(code: 'уав', name: 'БПЛА'), contains('Код'));
      expect(
        disciplineError(code: 'uav racing', name: 'БПЛА'),
        contains('Код'),
      );
    });

    test('название: 3..120 байт', () {
      // «аб» — две буквы, но 4 байта: законно. «ab» — тоже две буквы, но 2
      // байта: сервер такой код не примет. Вот из-за чего весь сыр-бор с байтами.
      expect(disciplineError(name: 'аб'), isNull);
      expect(disciplineError(name: 'abc'), isNull);
      expect(disciplineError(name: 'ab'), contains('3 байт'));
      expect(disciplineError(name: 'а'), contains('3 байт'));
      expect(disciplineError(name: '   '), contains('3 байт'));
      expect(disciplineError(name: 'н' * 60), isNull);
      expect(disciplineError(name: 'н' * 61), contains('120 байт'));
    });

    test('переименование код не проверяет: он часть URL', () {
      expect(disciplineError(name: 'Новое название'), isNull);
    });
  });
}
