import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor(private http: HttpClient) {}

  /** Fetch CSRF cookie from Sanctum before login */
  getCsrfCookie(): Observable<void> {
    return this.http.get<void>('/sanctum/csrf-cookie');
  }

  /** Login with email/password */
  login(email: string, password: string): Observable<{ user: User }> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.http.post<{ user: User }>('/login', { email, password }, { withCredentials: true })),
      tap(response => this.currentUserSignal.set(response.user))
    );
  }

  /** Logout and clear user state */
  logout(): Observable<void> {
    return this.http.post<void>('/logout', {}, { withCredentials: true }).pipe(
      tap(() => this.currentUserSignal.set(null))
    );
  }

  /** Clear the current user state */
  clearUser(): void {
    this.currentUserSignal.set(null);
  }

  /** Fetch the current authenticated user (used on app init) */
  fetchUser(): Observable<User | null> {
    return this.http.get<{ user: User }>('/api/user', { withCredentials: true }).pipe(
      tap(response => this.currentUserSignal.set(response.user)),
      map(response => response.user),
      catchError(() => {
        this.currentUserSignal.set(null);
        return of(null);
      })
    );
  }
}
