import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const cloned = req.clone({
    withCredentials: true,
    setHeaders: { Accept: 'application/json' },
  });

  return next(cloned).pipe(
    catchError(error => {
      if (error.status === 401) {
        authService.clearUser();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
