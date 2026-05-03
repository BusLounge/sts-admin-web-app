import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';
import '../models/admin_user.dart';
import '../models/pending_notification.dart';
import '../services/api_client.dart';

class AppState extends ChangeNotifier {
  AppState() : _apiClient = ApiClient(baseUrl: AppConfig.apiBaseUrl);

  static const String _tokenKey = 'sts_admin_access_token';
  static const String _adminKey = 'sts_admin_user';

  final ApiClient _apiClient;

  bool _isBootstrapping = true;
  bool _isLoading = false;
  String? _errorMessage;
  AdminUser? _currentUser;
  List<PendingNotification> _notifications = <PendingNotification>[];

  bool get isBootstrapping => _isBootstrapping;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  AdminUser? get currentUser => _currentUser;
  bool get isAuthenticated => _apiClient.token != null && _apiClient.token!.isNotEmpty;
  List<PendingNotification> get notifications => List.unmodifiable(_notifications);

  int get totalPendingCount => _notifications.length;

  Future<void> bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final savedAdmin = prefs.getString(_adminKey);

    if (token != null && token.isNotEmpty) {
      _apiClient.token = token;
      if (savedAdmin != null && savedAdmin.isNotEmpty) {
        _currentUser = AdminUser.fromJson(Map<String, dynamic>.from(jsonDecode(savedAdmin) as Map));
      }
      await refreshNotifications(silent: true);
    }

    _isBootstrapping = false;
    notifyListeners();
  }

  Future<void> login({required String email, required String password}) async {
    _setLoading(true);
    try {
      final user = await _apiClient.login(email: email, password: password);
      _currentUser = user;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, _apiClient.token!);
      await prefs.setString(_adminKey, jsonEncode(user.toJson()));

      await refreshNotifications(silent: true);
      _errorMessage = null;
    } on ApiException catch (error) {
      _errorMessage = error.message;
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    await _clearAuthSession();
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> _clearAuthSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_adminKey);
    _apiClient.token = null;
    _currentUser = null;
    _notifications = <PendingNotification>[];
  }

  Future<void> refreshNotifications({bool silent = false}) async {
    if (!silent) {
      _setLoading(true);
    }

    try {
      _notifications = await _apiClient.fetchPendingNotifications();
      _errorMessage = null;
    } on ApiException catch (error) {
      final normalized = error.message.toLowerCase();
      final tokenInvalid =
          normalized.contains('invalid token') ||
          normalized.contains('authorization header required') ||
          normalized.contains('authorization bearer token required');

      if (tokenInvalid) {
        await _clearAuthSession();
        _errorMessage = 'Session expired. Please sign in again.';
      } else {
        _errorMessage = error.message;
      }

      if (!silent) {
        rethrow;
      }
    } finally {
      if (!silent) {
        _setLoading(false);
      } else {
        notifyListeners();
      }
    }
  }

  Future<void> approve(PendingNotification item, String notes) async {
    _setLoading(true);
    try {
      await _apiClient.approveNotification(item, notes);
      await refreshNotifications(silent: true);
    } finally {
      _setLoading(false);
    }
  }

  Future<void> reject(PendingNotification item, String notes) async {
    _setLoading(true);
    try {
      await _apiClient.rejectNotification(item, notes);
      await refreshNotifications(silent: true);
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}