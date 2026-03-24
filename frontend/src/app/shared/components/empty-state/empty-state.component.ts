import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon() }}</mat-icon>
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.2);
    }
    h3 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.5);
    }
    p {
      margin: 0 0 16px;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.4);
    }
  `],
})
export class EmptyStateComponent {
  icon = input('inbox');
  title = input('Nothing here yet');
  message = input('');
}
