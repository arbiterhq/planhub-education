import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    // Will be wrapped with layout component in Task 05
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'projects', loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent) },
      { path: 'projects/:id', loadComponent: () => import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) },
      { path: 'subcontractors', loadComponent: () => import('./features/subcontractors/subcontractor-list/subcontractor-list.component').then(m => m.SubcontractorListComponent) },
      { path: 'subcontractors/:id', loadComponent: () => import('./features/subcontractors/subcontractor-detail/subcontractor-detail.component').then(m => m.SubcontractorDetailComponent) },
      { path: 'bids', loadComponent: () => import('./features/bids/bid-list/bid-list.component').then(m => m.BidListComponent) },
      { path: 'bids/invite', loadComponent: () => import('./features/bids/send-itb/send-itb.component').then(m => m.SendItbComponent) },
      { path: 'invoices', loadComponent: () => import('./features/invoices/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent) },
      { path: 'messages', loadComponent: () => import('./features/messages/message-list/message-list.component').then(m => m.MessageListComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: 'dashboard' },
];
