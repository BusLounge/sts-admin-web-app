import { Component } from '@angular/core';
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
  isLoading: boolean = false;
  errorMessage: string = '';

  // Forgot password properties
  showForgotPasswordModal: boolean = false;
  resetEmail: string = '';
  isResetLoading: boolean = false;
  resetSuccessMessage: string = '';
  resetErrorMessage: string = '';

  constructor(
    private router: Router,
    private adminAuthService: AdminAuthService
  ) {}

  onLogin() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Real login using admin auth service
    this.adminAuthService.login(this.username, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Login successful', response);
        // Navigate to admin dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login failed', error);

        // Handle different error responses
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please check if the backend is running.';
        } else if (error.error?.error) {
          this.errorMessage = error.error.error;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
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
    this.showForgotPasswordModal = true;
    this.resetEmail = '';
    this.resetSuccessMessage = '';
    this.resetErrorMessage = '';
  }

  closeForgotPasswordModal() {
    this.showForgotPasswordModal = false;
    this.resetEmail = '';
    this.resetSuccessMessage = '';
    this.resetErrorMessage = '';
  }

  onForgotPassword() {
    if (!this.resetEmail) {
      this.resetErrorMessage = 'Please enter your email address';
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.resetEmail)) {
      this.resetErrorMessage = 'Please enter a valid email address';
      return;
    }

    this.isResetLoading = true;
    this.resetErrorMessage = '';
    this.resetSuccessMessage = '';

    // Simulate password reset process
    setTimeout(() => {
      this.isResetLoading = false;
      
      // For demo purposes, always show success
      // In real app, you would call your backend API
      this.resetSuccessMessage = `Password reset link has been sent to ${this.resetEmail}. Please check your email and follow the instructions to reset your password.`;
      
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        this.closeForgotPasswordModal();
      }, 3000);
    }, 2000);
  }
}
