import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Forgot password properties
  showForgotPasswordModal = signal<boolean>(false);
  resetEmail: string = '';
  isResetLoading = signal<boolean>(false);
  resetSuccessMessage = signal<string>('');
  resetErrorMessage = signal<string>('');

  constructor(
    private router: Router,
    private adminAuthService: AdminAuthService
  ) {}

  onLogin() {
    if (!this.username || !this.password) {
      this.errorMessage.set('Please enter both email and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    console.log('Attempting login with:', this.username);

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (this.isLoading()) {
        this.isLoading.set(false);
        this.errorMessage.set('Request timeout. Server is taking too long to respond. Please try again.');
        console.error('Request timeout after 30 seconds');
      }
    }, 30000); // 30 second timeout

    // Real login using admin auth service
    this.adminAuthService.login(this.username, this.password).subscribe({
      next: (response) => {
        clearTimeout(timeoutId);
        this.isLoading.set(false);
        console.log('✅ Login successful', response);
        // Navigate to admin dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        clearTimeout(timeoutId);
        this.isLoading.set(false);
        console.error('❌ Login failed with error:', error);
        console.error('Error status:', error.status);
        console.error('Error details:', error.error);

        // Handle different error responses with detailed messages
        if (error.status === 400) {
          this.errorMessage.set('Bad request. Please check your email and password format.');
          console.error('400 Bad Request - Request format issue');
        } else if (error.status === 401) {
          this.errorMessage.set('Invalid email or password. Please check your credentials.');
          console.error('401 Unauthorized - Invalid credentials');
        } else if (error.status === 403) {
          this.errorMessage.set('Access forbidden. Your account may be inactive.');
          console.error('403 Forbidden - Account inactive or no permission');
        } else if (error.status === 404) {
          this.errorMessage.set('Login endpoint not found. Backend may not be configured correctly.');
          console.error('404 Not Found - Endpoint missing');
        } else if (error.status === 500) {
          this.errorMessage.set('Server error. Please try again later or contact support.');
          console.error('500 Internal Server Error');
        } else if (error.status === 0) {
          this.errorMessage.set('Cannot connect to server. Check your internet connection or backend may be down.');
          console.error('Network error - CORS, network failure, or server down');
        } else if (error.error?.error) {
          this.errorMessage.set(error.error.error);
          console.error('Custom error message:', error.error.error);
        } else if (error.message) {
          this.errorMessage.set(`Error: ${error.message}`);
          console.error('Error message:', error.message);
        } else {
          this.errorMessage.set(`Login failed (Status: ${error.status}). Please try again or contact support.`);
          console.error('Unknown error:', error);
        }
      },
      complete: () => {
        clearTimeout(timeoutId);
        // Ensure loading is always stopped
        if (this.isLoading()) {
          this.isLoading.set(false);
          console.log('Login request completed');
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  // Forgot password methods
  openForgotPasswordModal(event: Event) {
    event.preventDefault();
    this.showForgotPasswordModal.set(true);
    this.resetEmail = '';
    this.resetSuccessMessage.set('');
    this.resetErrorMessage.set('');
  }

  closeForgotPasswordModal() {
    this.showForgotPasswordModal.set(false);
    this.resetEmail = '';
    this.resetSuccessMessage.set('');
    this.resetErrorMessage.set('');
  }

  onForgotPassword() {
    if (!this.resetEmail) {
      this.resetErrorMessage.set('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.resetEmail)) {
      this.resetErrorMessage.set('Please enter a valid email address');
      return;
    }

    this.isResetLoading.set(true);
    this.resetErrorMessage.set('');
    this.resetSuccessMessage.set('');

    // Call backend API for password reset
    this.adminAuthService.requestPasswordReset(this.resetEmail).subscribe({
      next: (response: any) => {
        this.isResetLoading.set(false);
        this.resetSuccessMessage.set(response.message || 'Password reset code has been sent to your email. Please check your email for the reset code.');
        
        // In development, show the reset token
        if (response.reset_token) {
          console.log('🔑 Reset Token (DEV ONLY):', response.reset_token);
          this.resetSuccessMessage.update(msg => msg + ` (Dev Token: ${response.reset_token})`);
        }
        
        // Auto-close modal after 5 seconds
        setTimeout(() => {
          this.closeForgotPasswordModal();
        }, 5000);
      },
      error: (error) => {
        this.isResetLoading.set(false);
        console.error('❌ Password reset request failed:', error);
        
        if (error.error?.error) {
          this.resetErrorMessage.set(error.error.error);
        } else if (error.status === 0) {
          this.resetErrorMessage.set('Cannot connect to server. Please check your connection.');
        } else {
          this.resetErrorMessage.set('Failed to send reset email. Please try again.');
        }
      }
    });
  }
}
