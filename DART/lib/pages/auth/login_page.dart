library;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/auth/auth.dart';
import '../../shared/ui/ui.dart';
import '../../shared/utils/utils.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();

  final _email = TextEditingController();
  final _password = TextEditingController();
  final _fullName = TextEditingController();
  final _city = TextEditingController();
  final _organization = TextEditingController();

  bool _register = false;

  @override
  void dispose() {
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
    final error = auth.error;
    if (error != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error),
          backgroundColor: AppTheme.surfaceElevated,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: const BorderSide(color: AppTheme.border),
          ),
        ),
      );
    }
  }

  void _fillDemo(String email, String password) {
    setState(() {
      _email.text = email;
      _password.text = password;
      _register = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthController>().isLoading;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.border),
                ),
                padding: const EdgeInsets.all(26),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceElevated,
                              borderRadius: BorderRadius.circular(13),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: const Icon(
                              Icons.terminal_rounded,
                              size: 22,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'ФСП Платформа',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.4,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _register ? 'Регистрация спортсмена' : 'Вход в платформу',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Container(
                        height: 42,
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF11141A),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: InkWell(
                                borderRadius: BorderRadius.circular(9),
                                onTap: isLoading ? null : () => setState(() => _register = false),
                                child: Container(
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: !_register ? AppTheme.surfaceElevated : Colors.transparent,
                                    borderRadius: BorderRadius.circular(9),
                                    border: !_register ? Border.all(color: AppTheme.borderLight) : null,
                                  ),
                                  child: Text(
                                    'Вход',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: !_register ? FontWeight.w600 : FontWeight.w500,
                                      color: !_register ? AppTheme.textPrimary : AppTheme.textTertiary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: InkWell(
                                borderRadius: BorderRadius.circular(9),
                                onTap: isLoading ? null : () => setState(() => _register = true),
                                child: Container(
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: _register ? AppTheme.surfaceElevated : Colors.transparent,
                                    borderRadius: BorderRadius.circular(9),
                                    border: _register ? Border.all(color: AppTheme.borderLight) : null,
                                  ),
                                  child: Text(
                                    'Регистрация',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: _register ? FontWeight.w600 : FontWeight.w500,
                                      color: _register ? AppTheme.textPrimary : AppTheme.textTertiary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                        decoration: const InputDecoration(
                          labelText: 'Электронная почта',
                          prefixIcon: Icon(Icons.alternate_email_rounded, size: 19, color: AppTheme.textTertiary),
                        ),
                        validator: (value) => (value ?? '').contains('@') ? null : 'Нужна почта',
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _password,
                        obscureText: true,
                        style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                        decoration: const InputDecoration(
                          labelText: 'Пароль',
                          prefixIcon: Icon(Icons.lock_outline_rounded, size: 19, color: AppTheme.textTertiary),
                          helperText: 'от 8 до 128 байт',
                        ),
                        validator: (value) {
                          final bytes = utf8Length(value ?? '');
                          if (bytes < 8) return 'Пароль — не короче 8 байт';
                          if (bytes > 128) return 'Пароль — не длиннее 128 байт';
                          return null;
                        },
                      ),
                      if (_register) ...[
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _fullName,
                          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                          decoration: const InputDecoration(
                            labelText: 'ФИО',
                            prefixIcon: Icon(Icons.badge_outlined, size: 19, color: AppTheme.textTertiary),
                          ),
                          validator: (value) {
                            final name = (value ?? '').trim();
                            if (utf8Length(name) < 2) return 'ФИО — от 2 байт';
                            if (utf8Length(name) > 100) return utf8LimitHint('ФИО', 100);
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _organization,
                          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                          decoration: const InputDecoration(
                            labelText: 'Учебная организация (опционально)',
                            prefixIcon: Icon(Icons.account_balance_outlined, size: 19, color: AppTheme.textTertiary),
                          ),
                          validator: (value) => utf8Length((value ?? '').trim()) > 160
                              ? utf8LimitHint('Организация', 160)
                              : null,
                        ),
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _city,
                          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                          decoration: const InputDecoration(
                            labelText: 'Город (опционально)',
                            prefixIcon: Icon(Icons.location_on_outlined, size: 19, color: AppTheme.textTertiary),
                          ),
                          validator: (value) => utf8Length((value ?? '').trim()) > 100
                              ? utf8LimitHint('Город', 100)
                              : null,
                        ),
                      ],
                      const SizedBox(height: 22),
                      AppButton(
                        text: _register ? 'Создать аккаунт' : 'Войти',
                        onPressed: isLoading ? null : _submit,
                      ),
                      if (isLoading) ...[
                        const SizedBox(height: 16),
                        const LinearProgressIndicator(
                          minHeight: 2,
                          backgroundColor: AppTheme.border,
                          valueColor: AlwaysStoppedAnimation(AppTheme.textPrimary),
                        ),
                      ],
                      const SizedBox(height: 22),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF101217),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.key_rounded, size: 14, color: AppTheme.textTertiary),
                                SizedBox(width: 6),
                                Text(
                                  'Быстрый вход для тестов',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textTertiary,
                                    letterSpacing: 0.2,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            InkWell(
                              onTap: () => _fillDemo('athlete1@arena.local', 'password123'),
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                                decoration: BoxDecoration(
                                  color: AppTheme.surface,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppTheme.border),
                                ),
                                child: const Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'athlete1@arena.local',
                                        style: TextStyle(fontSize: 12, color: AppTheme.textPrimary, fontWeight: FontWeight.w500),
                                      ),
                                    ),
                                    Text('спортсмен', style: TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            InkWell(
                              onTap: () => _fillDemo('organizer@arena.local', 'change-me-for-local-demo'),
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                                decoration: BoxDecoration(
                                  color: AppTheme.surface,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppTheme.border),
                                ),
                                child: const Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'organizer@arena.local',
                                        style: TextStyle(fontSize: 12, color: AppTheme.textPrimary, fontWeight: FontWeight.w500),
                                      ),
                                    ),
                                    Text('организатор', style: TextStyle(fontSize: 11, color: AppTheme.textTertiary)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
