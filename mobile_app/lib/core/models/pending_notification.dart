import 'package:flutter/material.dart';

enum NotificationType { bus, driver, conductor, lounge, busOwner, loungeOwner }

extension NotificationTypeX on NotificationType {
  String get apiSegment {
    switch (this) {
      case NotificationType.bus:
        return 'buses';
      case NotificationType.driver:
        return 'drivers';
      case NotificationType.conductor:
        return 'conductors';
      case NotificationType.lounge:
        return 'lounges';
      case NotificationType.busOwner:
        return 'bus-owners';
      case NotificationType.loungeOwner:
        return 'lounge-owners';
    }
  }

  String get displayLabel {
    switch (this) {
      case NotificationType.bus:
        return 'Bus';
      case NotificationType.driver:
        return 'Driver';
      case NotificationType.conductor:
        return 'Conductor';
      case NotificationType.lounge:
        return 'Lounge';
      case NotificationType.busOwner:
        return 'Bus Owner';
      case NotificationType.loungeOwner:
        return 'Lounge Owner';
    }
  }

  String get pendingEndpoint {
    switch (this) {
      case NotificationType.bus:
        return '/buses/pending';
      case NotificationType.driver:
        return '/drivers/pending';
      case NotificationType.conductor:
        return '/conductors/pending';
      case NotificationType.lounge:
        return '/lounges/pending';
      case NotificationType.busOwner:
        return '/bus-owners/pending';
      case NotificationType.loungeOwner:
        return '/lounge-owners/pending';
    }
  }

  String get approveStatus {
    switch (this) {
      case NotificationType.bus:
      case NotificationType.driver:
      case NotificationType.conductor:
      case NotificationType.lounge:
        return 'Verified';
      case NotificationType.busOwner:
        return 'verified';
      case NotificationType.loungeOwner:
        return 'approved';
    }
  }

  String get rejectStatus {
    switch (this) {
      case NotificationType.bus:
      case NotificationType.driver:
      case NotificationType.conductor:
      case NotificationType.lounge:
        return 'Rejected';
      case NotificationType.busOwner:
      case NotificationType.loungeOwner:
        return 'rejected';
    }
  }

  Color get color {
    switch (this) {
      case NotificationType.bus:
        return const Color(0xFF4EA1FF);
      case NotificationType.driver:
        return const Color(0xFF2DD4BF);
      case NotificationType.conductor:
        return const Color(0xFFF59E0B);
      case NotificationType.lounge:
        return const Color(0xFFF472B6);
      case NotificationType.busOwner:
        return const Color(0xFF60A5FA);
      case NotificationType.loungeOwner:
        return const Color(0xFF22C55E);
    }
  }

  IconData get icon {
    switch (this) {
      case NotificationType.bus:
        return Icons.directions_bus_filled_rounded;
      case NotificationType.driver:
        return Icons.badge_rounded;
      case NotificationType.conductor:
        return Icons.work_rounded;
      case NotificationType.lounge:
        return Icons.storefront_rounded;
      case NotificationType.busOwner:
        return Icons.business_rounded;
      case NotificationType.loungeOwner:
        return Icons.apartment_rounded;
    }
  }
}

class NotificationField {
  const NotificationField({
    required this.label,
    required this.value,
    this.multiline = false,
  });

  final String label;
  final String value;
  final bool multiline;
}

class PendingNotification {
  const PendingNotification({
    required this.type,
    required this.id,
    required this.title,
    required this.message,
    required this.fields,
    required this.raw,
    required this.loadedAt,
  });

  final NotificationType type;
  final String id;
  final String title;
  final String message;
  final List<NotificationField> fields;
  final Map<String, dynamic> raw;
  final DateTime loadedAt;

  bool get needsDocuments => true;

  Map<String, dynamic> approvalBody(String notes) {
    final trimmed = notes.trim();
    switch (type) {
      case NotificationType.bus:
      case NotificationType.driver:
      case NotificationType.conductor:
      case NotificationType.lounge:
        return <String, dynamic>{'status': type.approveStatus, 'documents': trimmed};
      case NotificationType.busOwner:
        return <String, dynamic>{'verification_status': type.approveStatus, 'verification_documents': trimmed};
      case NotificationType.loungeOwner:
        return <String, dynamic>{'verification_status': type.approveStatus, 'verification_notes': trimmed};
    }
  }

  Map<String, dynamic> rejectionBody(String notes) {
    final trimmed = notes.trim();
    switch (type) {
      case NotificationType.bus:
      case NotificationType.driver:
      case NotificationType.conductor:
      case NotificationType.lounge:
        return <String, dynamic>{'status': type.rejectStatus};
      case NotificationType.busOwner:
        return <String, dynamic>{'verification_status': type.rejectStatus, 'verification_documents': trimmed};
      case NotificationType.loungeOwner:
        return <String, dynamic>{'verification_status': type.rejectStatus, 'verification_notes': trimmed};
    }
  }
}