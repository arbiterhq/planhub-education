import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-code">404</div>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <button mat-raised-button color="primary" (click)="goToDashboard()">
        <mat-icon>dashboard</mat-icon>
        Go to Dashboard
      </button>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;
    }
    .not-found-code {
      font-size: 96px;
      font-weight: 800;
      color: #1565C0;
      line-height: 1;
      margin-bottom: 16px;
    }
    h2 {
      margin: 0 0 12px;
      font-size: 28px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
    }
    p {
      margin: 0 0 32px;
      font-size: 16px;
      color: rgba(0, 0, 0, 0.5);
    }
  `],
})
export class NotFoundComponent {
  private router = inject(Router);

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
