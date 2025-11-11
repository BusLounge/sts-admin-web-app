export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  admin_user: AdminUser;
}

export interface AdminChangePasswordRequest {
  old_password: string;
  new_password: string;
}
