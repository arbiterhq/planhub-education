import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  styles: [`
    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    mat-card {
      width: 100%;
      max-width: 400px;
      padding: 8px;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 28px;
      font-weight: 700;
      color: #1976d2;
    }
    .subtitle {
      margin: 0 0 24px;
      color: #666;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 8px;
    }
    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .submit-btn {
      width: 100%;
      margin-top: 8px;
    }
    .demo-hint {
      margin-top: 16px;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    .spinner-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }
  `],
  template: `
    <div class="login-page">
      <mat-card>
        <mat-card-content>
          <h1>PlanHub</h1>
          <p class="subtitle">Sign in to your account</p>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Enter a valid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="submit-btn"
              [disabled]="loading"
            >
              <span class="spinner-wrapper" *ngIf="loading">
                <mat-spinner diameter="20"></mat-spinner>
                Signing in...
              </span>
              <span *ngIf="!loading">Sign In</span>
            </button>
          </form>

          <p class="demo-hint">Demo: admin@apexconstruction.com / password</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 422 && err.error?.errors?.email) {
          this.errorMessage = err.error.errors.email[0];
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      },
    });
  }
}
