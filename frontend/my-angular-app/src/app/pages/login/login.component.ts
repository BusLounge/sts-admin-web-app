import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(private router: Router) {}

  onLogin() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simulate login process
    setTimeout(() => {
      this.isLoading = false;
      
      // For demo purposes, accept any credentials
      // In real app, you would validate against your backend
      if (this.username && this.password) {
        // Navigate to admin dashboard
        console.log('Login successful');
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = 'Invalid credentials';
      }
    }, 1500);
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
