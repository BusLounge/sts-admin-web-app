import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/state/app_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF07111D), Color(0xFF0B1D31), Color(0xFF07111D)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F1B2D).withValues(alpha: 0.94),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: const Color(0x1FFFFFFF)),
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF62D1FF), Color(0xFF2DD4BF)],
                            ),
                            borderRadius: BorderRadius.circular(22),
                          ),
                          child: const Icon(Icons.notifications_active_rounded, color: Color(0xFF07111D), size: 34),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Notification Portal',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Sign in with an admin account to review pending notifications and complete approvals from the Go backend.',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF9AA9BD), height: 1.5),
                        ),
                        const SizedBox(height: 28),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Admin email',
                            prefixIcon: Icon(Icons.alternate_email_rounded),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Enter an admin email';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Password',
                            prefixIcon: Icon(Icons.lock_rounded),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Enter the password';
                            }
                            return null;
                          },
                        ),
                        if (state.errorMessage != null) ...[
                          const SizedBox(height: 16),
                          Text(
                            state.errorMessage!,
                            style: const TextStyle(color: Color(0xFFFF6B6B)),
                          ),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          height: 56,
                          child: ElevatedButton(
                            onPressed: state.isLoading ? null : _handleLogin,
                            child: state.isLoading
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF07111D)),
                                  )
                                : const Text('Sign in'),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'API base: ${state.isBootstrapping ? 'loading...' : 'use --dart-define=API_BASE_URL'}',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF7F91A8)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final state = context.read<AppState>();

    try {
      await state.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
    } catch (_) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(state.errorMessage ?? 'Login failed')),
      );
    }
  }
}