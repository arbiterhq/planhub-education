import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <nav class="breadcrumb">
      @for (item of items; track item.label; let last = $last) {
        @if (!last && item.link) {
          <a [routerLink]="item.link">{{ item.label }}</a>
          <mat-icon class="separator">chevron_right</mat-icon>
        } @else {
          <span class="current">{{ item.label }}</span>
        }
      }
    </nav>
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .breadcrumb a {
      color: #1976d2;
      text-decoration: none;
    }
    .breadcrumb a:hover {
      text-decoration: underline;
    }
    .separator {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: rgba(0,0,0,0.38);
    }
    .current {
      color: rgba(0,0,0,0.6);
    }
  `],
})
export class BreadcrumbComponent {
  @Input() items: { label: string; link?: string }[] = [];
}
