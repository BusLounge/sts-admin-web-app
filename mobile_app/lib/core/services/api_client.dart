import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/admin_user.dart';
import '../models/pending_notification.dart';

class ApiClient {
  ApiClient({required this.baseUrl, http.Client? client})
      : _client = client ?? http.Client();

  final String baseUrl;
  final http.Client _client;

  String? token;

  Map<String, String> _headers({bool jsonBody = true}) {
    final headers = <String, String>{};
    if (jsonBody) {
      headers['Content-Type'] = 'application/json';
    }
    if (token != null && token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<AdminUser> login({required String email, required String password}) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/admin/auth/login'),
      headers: _headers(),
      body: jsonEncode(<String, String>{'email': email, 'password': password}),
    );

    final decoded = _decode(response);
    token = decoded['access_token']?.toString();
    if (token == null || token!.isEmpty) {
      throw ApiException('Login succeeded but access token was missing.');
    }

    return AdminUser.fromJson(Map<String, dynamic>.from(decoded['admin_user'] as Map));
  }

  Future<List<PendingNotification>> fetchPendingNotifications() async {
    final groups = await Future.wait<List<PendingNotification>>(<Future<List<PendingNotification>>>[
      _fetchPendingList(NotificationType.bus),
      _fetchPendingList(NotificationType.driver),
      _fetchPendingList(NotificationType.conductor),
      _fetchPendingList(NotificationType.lounge),
      _fetchPendingList(NotificationType.busOwner),
      _fetchPendingList(NotificationType.loungeOwner),
    ]);

    final notifications = groups.expand((group) => group).toList();
    notifications.sort((left, right) => right.loadedAt.compareTo(left.loadedAt));
    return notifications;
  }

  Future<void> approveNotification(PendingNotification item, String notes) {
    return _submitDecision(
      item: item,
      body: item.approvalBody(notes),
    );
  }

  Future<void> rejectNotification(PendingNotification item, String notes) {
    return _submitDecision(
      item: item,
      body: item.rejectionBody(notes),
    );
  }

  Future<List<PendingNotification>> _fetchPendingList(NotificationType type) async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl${type.pendingEndpoint}'),
        headers: _headers(jsonBody: false),
      );

      final decoded = _decode(response);
      if (decoded is! List) {
        throw ApiException('Unexpected response format for ${type.displayLabel} pending data.');
      }
      final list = decoded;

      return list
          .whereType<Map>()
          .map((entry) => _mapNotification(type, Map<String, dynamic>.from(entry)))
          .toList();
    } on ApiException {
      rethrow;
    } catch (error) {
      throw ApiException('Failed to load ${type.displayLabel} pending data: $error');
    }
  }

  PendingNotification _mapNotification(NotificationType type, Map<String, dynamic> json) {
    final loadedAt = DateTime.now();

    switch (type) {
      case NotificationType.bus:
        return PendingNotification(
          type: type,
          id: json['id']?.toString() ?? '',
          title: 'New Bus Added Request',
          message:
              'A new bus registration request has been submitted: Bus No: ${json['permit_number'] ?? json['bus_number'] ?? 'Unknown'}, Route: ${json['custom_route_name'] ?? 'Not specified'}. Awaiting approval.',
          fields: <NotificationField>[
            NotificationField(label: 'Company', value: _stringValue(json['company_name'])),
            NotificationField(label: 'Phone Number', value: _stringValue(json['business_phone'])),
            NotificationField(label: 'NIC Number', value: _stringValue(json['identify_or_incorporation_no'])),
            NotificationField(label: 'Email', value: _stringValue(json['business_email'])),
            NotificationField(label: 'Permit Number', value: _stringValue(json['permit_number'])),
            NotificationField(label: 'Registered Number', value: _stringValue(json['license_plate'])),
            NotificationField(label: 'License plate from the permit', value: _stringValue(json['license_plate'])),
            NotificationField(label: 'Route via (Optional)', value: _stringValue(json['custom_route_name'])),
            NotificationField(label: 'Approved Fare', value: _stringValue(json['fare_per_seat'] ?? 0)),
            NotificationField(label: 'Bus Type', value: _stringValue(json['bus_type'] ?? 'Normal')),
            NotificationField(label: 'Validity period', value: '1/11/2025- 1/11/2026'),
            NotificationField(label: 'Seat numbers', value: _stringValue(json['total_seats'] ?? 0)),
          ],
          raw: json,
          loadedAt: loadedAt,
        );
      case NotificationType.driver:
        return PendingNotification(
          type: type,
          id: json['id']?.toString() ?? '',
          title: 'New Driver Added Request',
          message: 'A new driver registration request has been submitted: ${json['name'] ?? 'Unknown'}',
          fields: <NotificationField>[
            NotificationField(label: 'Name', value: _stringValue(json['name'])),
            NotificationField(label: 'Contact Number', value: _stringValue(json['contact_number'])),
            NotificationField(label: 'License Number', value: _stringValue(json['license_number'])),
            NotificationField(label: 'License Expiry Date', value: _stringValue(json['license_expiry_date'])),
            NotificationField(label: 'Experience Years', value: _stringValue(json['experience_years'] ?? 0)),
            NotificationField(label: 'Employment Status', value: _stringValue(json['status'])),
            NotificationField(label: 'Hire Date', value: _stringValue(json['hire_date'])),
            NotificationField(label: 'Verification Notes', value: _stringValue(json['verification_notes'] ?? 'None')),
          ],
          raw: json,
          loadedAt: loadedAt,
        );
      case NotificationType.conductor:
        return PendingNotification(
          type: type,
          id: json['id']?.toString() ?? '',
          title: 'New Conductor Added Request',
          message: 'A new conductor registration request has been submitted: ${json['name'] ?? 'Unknown'}',
          fields: <NotificationField>[
            NotificationField(label: 'Name', value: _stringValue(json['name'])),
            NotificationField(label: 'Contact Number', value: _stringValue(json['contact_number'])),
            NotificationField(label: 'License Number', value: _stringValue(json['license_number'])),
            NotificationField(label: 'License Expiry Date', value: _stringValue(json['license_expiry_date'])),
            NotificationField(label: 'Experience Years', value: _stringValue(json['experience_years'] ?? 0)),
            NotificationField(label: 'Employment Status', value: _stringValue(json['status'])),
            NotificationField(label: 'Hire Date', value: _stringValue(json['hire_date'])),
            NotificationField(label: 'Verification Notes', value: _stringValue(json['verification_notes'] ?? 'None')),
          ],
          raw: json,
          loadedAt: loadedAt,
        );
      case NotificationType.lounge:
        return PendingNotification(
          type: type,
          id: json['lounge_id']?.toString() ?? json['id']?.toString() ?? '',
          title: 'New Lounge Added Request',
          message: 'A new lounge registration request has been submitted: ${json['lounge_name'] ?? 'Unknown'}',
          fields: <NotificationField>[
            NotificationField(label: 'Lounge Name', value: _stringValue(json['lounge_name'])),
            NotificationField(label: 'Owner Name', value: _stringValue(json['lounge_owner'])),
            NotificationField(label: 'Owner NIC', value: _stringValue(json['owner_nic'])),
            NotificationField(label: 'Owner Email', value: _stringValue(json['owner_email'])),
            NotificationField(label: 'Owner Contact', value: _stringValue(json['owner_contact'])),
            NotificationField(label: 'Lounge Contact', value: _stringValue(json['lounge_contact'])),
            NotificationField(label: 'Address', value: _stringValue(json['address'])),
            NotificationField(label: 'Capacity', value: _stringValue(json['capacity'] ?? 0)),
            NotificationField(label: 'Price Per Hour', value: _stringValue(json['price_per_hour'] ?? 0)),
            NotificationField(label: 'Marketplace', value: _stringValue(json['marketplace'])),
            NotificationField(label: 'Operational', value: _boolLabel(json['operational'])),
          ],
          raw: json,
          loadedAt: loadedAt,
        );
      case NotificationType.busOwner:
        return PendingNotification(
          type: type,
          id: json['id']?.toString() ?? '',
          title: 'New Bus Owner Added Request',
          message: 'A new bus owner registration request has been submitted: ${json['company_name'] ?? 'Unknown'}',
          fields: <NotificationField>[
            NotificationField(label: 'Company Name', value: _stringValue(json['company_name'])),
            NotificationField(label: 'Business Email', value: _stringValue(json['business_email'])),
            NotificationField(label: 'Business Phone', value: _stringValue(json['business_phone'])),
            NotificationField(label: 'NIC/Incorporation Number', value: _stringValue(json['identity_or_incorporation_no'])),
            NotificationField(label: 'Verification Status', value: _stringValue(json['verification_status'] ?? 'pending')),
          ],
          raw: json,
          loadedAt: loadedAt,
        );
      case NotificationType.loungeOwner:
        return PendingNotification(
          type: type,
          id: json['id']?.toString() ?? '',
          title: 'New Lounge Owner Added Request',
          message: 'A new lounge owner registration request has been submitted: ${json['manager_full_name'] ?? 'Unknown'}',
          fields: <NotificationField>[
            NotificationField(label: 'Manager Name', value: _stringValue(json['manager_full_name'])),
            NotificationField(label: 'Email', value: _stringValue(json['email'])),
            NotificationField(label: 'Contact Number', value: _stringValue(json['contact_number'])),
            NotificationField(label: 'NIC', value: _stringValue(json['nic'])),
            NotificationField(label: 'Business Name', value: _stringValue(json['business_name'])),
            NotificationField(label: 'Business License', value: _stringValue(json['business_license'])),
            NotificationField(label: 'Verification Status', value: _stringValue(json['verification_status'] ?? 'pending')),
          ],
          raw: json,
          loadedAt: loadedAt,
        );
    }
  }

  Future<void> _submitDecision({required PendingNotification item, required Map<String, dynamic> body}) async {
    final response = await _client.put(
      Uri.parse('$baseUrl/${item.type.apiSegment}/${item.id}/verify'),
      headers: _headers(),
      body: jsonEncode(body),
    );

    _decode(response);
  }

  dynamic _decode(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = _extractError(response.body);
      throw ApiException(message.isEmpty ? 'Request failed with status ${response.statusCode}' : message);
    }

    if (response.body.isEmpty) {
      return null;
    }

    return jsonDecode(response.body);
  }

  String _extractError(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic> && decoded['error'] != null) {
        return decoded['error'].toString();
      }
    } catch (_) {
      return body;
    }
    return body;
  }

  String _stringValue(dynamic value) {
    if (value == null) {
      return 'N/A';
    }
    if (value is num) {
      return value.toString();
    }
    if (value is bool) {
      return value ? 'Yes' : 'No';
    }
    return value.toString().trim().isEmpty ? 'N/A' : value.toString();
  }

  String _boolLabel(dynamic value) {
    if (value == true) {
      return 'Yes';
    }
    if (value == false) {
      return 'No';
    }
    return _stringValue(value);
  }
}

class ApiException implements Exception {
  ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}