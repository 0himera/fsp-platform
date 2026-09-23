/// Экран входа и регистрации (п.1 ТЗ).
///
/// НИКАКОЙ НАВИГАЦИИ ОТСЮДА: то, что пользователь вошёл, замечает `AuthGate`
/// в main.dart — он слушает `AuthController` и меняет экран сам. Если бы
/// страница входа ещё и толкала стек в `HomePage`, то после `logout` нас бы
/// вернуло не на форму, а в пустоту.
///
/// Вход и регистрация — один экран с переключателем: на сервере это два
/// соседних эндпоинта (`POST /api/auth/login`, `POST /api/auth/register`) с
/// общим набором полей, и держать ради этого два файла одинаковой формы —
/// способ разъехаться им в верстке и в подсказках.
library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/auth/auth.dart';
import '../../shared/ui/ui.dart';
import '../../shared/utils/text_bytes.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: _AuthCard()));
  }
}

class _AuthCard extends StatefulWidget {
  const _AuthCard();

  @override
  State<_AuthCard> createState() => _AuthCardState();
}

class _AuthCardState extends State<_AuthCard> {
  // Один ключ на форму: валидация полей работает через неё.
  final _formKey = GlobalKey<FormState>();

  final _email = TextEditingController();
  final _password = TextEditingController();
  final _fullName = TextEditingController();
  final _city = TextEditingController();
  final _organization = TextEditingController();

  /// false — вход, true — регистрация.
  bool _register = false;

  @override
  void dispose() {
    // Контроллеры живут дольше одного build — их обязательно закрыть, иначе
    // память утекает с каждым открытием экрана.
    _email.dispose();
    _password.dispose();
    _fullName.dispose();
    _city.dispose();
    _organization.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final auth = context.read<AuthController>();
    // read, а не watch: действие запускаем один раз, переподписываться на
    // контроллер ради нажатия кнопки не нужно.
    if (_register) {
      await auth.register(
        email: _email.text,
        password: _password.text,
        fullName: _fullName.text,
        city: _city.text,
        organization: _organization.text,
      );
    } else {
      await auth.login(email: _email.text, password: _password.text);
    }
    // Ошибку показываем диалогом, а не «тихим» текстом под полем: сервер
    // отвечает по-русски («Неверная почта или пароль»), и это единственный
    // канал, которым пользователь узнает причину отказа.
    final error = auth.error;
    if (error != null && mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthController>().isLoading;

    return Card(
      elevation: 3,
      margin: const EdgeInsets.all(24),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _register ? 'Регистрация спортсмена' : 'Вход в платформу',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Text(
                'Федерация спортивного программирования',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Электронная почта',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    (value ?? '').contains('@') ? null : 'Нужна почта',
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _password,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Пароль',
                  border: OutlineInputBorder(),
                  helperText: 'от 8 до 128 байт',
                ),
                // Границы сервера (`auth.go`: `len(password) < 8 || > 128`)
                // измеряются в байтах, поэтому и тут байты: четыре русские
                // буквы — это 8 байт, и сервер такой пароль принимает, хотя
                // «символов» в нём всего четыре.
                validator: (value) {
                  final bytes = utf8Length(value ?? '');
                  if (bytes < 8) return 'Пароль — не короче 8 байт';
                  if (bytes > 128) return 'Пароль — не длиннее 128 байт';
                  return null;
                },
              ),
              if (_register) ...[
                const SizedBox(height: 12),
                TextFormField(
                  controller: _fullName,
                  decoration: const InputDecoration(
                    labelText: 'ФИО',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    final name = (value ?? '').trim();
                    // Те же границы, что у сервера (2..100 байт): подсказка
                    // должна появляться до запроса, а не после отказа.
                    if (utf8Length(name) < 2) return 'ФИО — от 2 байт';
                    if (utf8Length(name) > 100) {
                      return utf8LimitHint('ФИО', 100);
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _organization,
                  decoration: const InputDecoration(
                    labelText: 'Учебная организация (можно не заполнять)',
                    border: OutlineInputBorder(),
                  ),
                  // Сервер отклоняет анкету с организацией длиннее 160 байт
                  // — здесь то же правило, но объяснённое человеку до отправки.
                  validator: (value) => utf8Length((value ?? '').trim()) > 160
                      ? utf8LimitHint('Организация', 160)
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _city,
                  decoration: const InputDecoration(
                    labelText: 'Город (можно не заполнять)',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) => utf8Length((value ?? '').trim()) > 100
                      ? utf8LimitHint('Город', 100)
                      : null,
                ),
              ],
              const SizedBox(height: 20),
              AppButton(
                text: _register ? 'Создать аккаунт' : 'Войти',
                // Пока идёт запрос, кнопка неактивна: повторное нажатие
                // породило бы второй login и гонку двух ответов.
                onPressed: isLoading ? null : _submit,
              ),
              TextButton(
                onPressed: isLoading
                    ? null
                    : () => setState(() => _register = !_register),
                child: Text(
                  _register
                      ? 'Уже есть аккаунт — войти'
                      : 'Нет аккаунта — зарегистрироваться',
                ),
              ),
              const SizedBox(height: 8),
              // Демо-доступы — из сида реального бэкенда (см. README в
              // `test-server/fsp-platform`): приложение работает только с API,
              // других учётных записей у него нет.              
              if (isLoading) ...[
                const SizedBox(height: 12),
                const LinearProgressIndicator(),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
