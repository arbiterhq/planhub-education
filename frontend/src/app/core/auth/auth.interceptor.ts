import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const notifications = inject(NotificationService);

  const cloned = req.clone({
    withCredentials: true,
    setHeaders: { Accept: 'application/json' },
  });

  return next(cloned).pipe(
    catchError(error => {
      if (error.status === 401) {
        authService.clearUser();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        notifications.error("You don't have permission to perform this action");
      } else if (error.status === 404) {
        notifications.error('The requested resource was not found');
      } else if (error.status === 0) {
        notifications.error('Unable to connect to the server. Check your connection.');
      } else if (error.status >= 500) {
        notifications.error('Something went wrong. Please try again.');
      }
      // 422 validation errors are handled by individual components
      return throwError(() => error);
    })
  );
};
