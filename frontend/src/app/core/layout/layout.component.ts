import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AsyncPipe } from '@angular/common';
import { map, shareReplay, interval, Subscription, startWith, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { MessageService } from '../services/message.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    AsyncPipe,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav class="sidenav"
        [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
        [mode]="(isHandset$ | async) ? 'over' : 'side'"
        [opened]="(isHandset$ | async) === false">
        <div class="sidenav-header">
          <mat-icon class="sidenav-brand-icon">construction</mat-icon>
          <span class="sidenav-brand-name">PlanHub</span>
        </div>
        <mat-nav-list>
          @for (item of navItems; track item.path) {
            <a mat-list-item
               [routerLink]="item.path"
               routerLinkActive="active-nav-item">
              <mat-icon matListItemIcon
                        [matBadge]="item.path === '/messages' && unreadCount() > 0 ? unreadCount() : null"
                        matBadgeColor="warn"
                        matBadgeSize="small">{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="app-toolbar">
          @if (isHandset$ | async) {
            <button mat-icon-button class="toolbar-btn" (click)="sidenav.toggle()" aria-label="Toggle menu">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="brand-name">PlanHub</span>
          <span class="spacer"></span>
          <span class="company-name">{{ authService.currentUser()?.company?.name }}</span>
          <span class="user-name">{{ authService.currentUser()?.name }}</span>
          <button mat-icon-button class="toolbar-btn" (click)="logout()" matTooltip="Logout" aria-label="Logout">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>

        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .sidenav-container {
      height: 100%;
    }

    .sidenav {
      width: 250px;
      border-right: none;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      padding: 20px 16px 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      margin-bottom: 8px;
    }

    .sidenav-brand-icon {
      color: #1565C0;
      margin-right: 8px;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .sidenav-brand-name {
      font-size: 18px;
      font-weight: 700;
      color: #1565C0;
      letter-spacing: 0.5px;
    }

    a.active-nav-item {
      background-color: rgba(21, 101, 192, 0.10) !important;
      color: #1565C0 !important;
    }

    a.active-nav-item mat-icon {
      color: #1565C0;
    }

    mat-sidenav-content {
      display: flex;
      flex-direction: column;
    }

    .app-toolbar {
      background-color: #1565C0;
      color: white;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .toolbar-btn {
      color: white;
    }

    .brand-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .spacer {
      flex: 1;
    }

    .company-name {
      font-size: 13px;
      opacity: 0.85;
      margin-right: 16px;
      display: none;
    }

    @media (min-width: 768px) {
      .company-name {
        display: inline;
      }
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      margin-right: 4px;
      opacity: 0.95;
    }

    .page-content {
      padding: 24px;
      flex: 1;
    }
  `],
})
export class LayoutComponent implements OnInit, OnDestroy {
  private breakpointObserver = inject(BreakpointObserver);
  private messageService = inject(MessageService);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);
  private router = inject(Router);

  isHandset$ = this.breakpointObserver
    .observe([Breakpoints.Handset])
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  unreadCount = signal(0);
  private pollSub?: Subscription;

  navItems = [
    { path: '/dashboard',      icon: 'dashboard',    label: 'Dashboard' },
    { path: '/projects',       icon: 'business',     label: 'Projects' },
    { path: '/subcontractors', icon: 'people',       label: 'Subcontractors' },
    { path: '/bids',           icon: 'gavel',        label: 'Bids' },
    { path: '/invoices',       icon: 'receipt_long', label: 'Invoices' },
    { path: '/messages',       icon: 'mail',         label: 'Messages' },
  ];

  ngOnInit(): void {
    this.pollSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.messageService.getUnreadCount())
    ).subscribe(({ count }) => this.unreadCount.set(count));
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  logout(): void {
    const data: ConfirmDialogData = {
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      confirmColor: 'warn',
    };
    this.dialog.open(ConfirmDialogComponent, { width: '360px', data })
      .afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.authService.logout().subscribe(() => {
          this.router.navigate(['/login']);
        });
      });
  }
}
