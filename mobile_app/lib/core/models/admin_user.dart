class AdminUser {
  const AdminUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.isActive,
    required this.permissions,
    required this.lastLoginAt,
  });

  final String id;
  final String email;
  final String fullName;
  final String role;
  final bool isActive;
  final List<String> permissions;
  final DateTime? lastLoginAt;

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      fullName: json['full_name']?.toString() ?? '',
      role: json['role']?.toString() ?? 'admin',
      isActive: json['is_active'] == true,
      permissions: (json['permissions'] as List<dynamic>? ?? const [])
          .map((value) => value.toString())
          .toList(),
      lastLoginAt: json['last_login_at'] == null
          ? null
          : DateTime.tryParse(json['last_login_at'].toString()),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'email': email,
      'full_name': fullName,
      'role': role,
      'is_active': isActive,
      'permissions': permissions,
      'last_login_at': lastLoginAt?.toIso8601String(),
    };
  }
}