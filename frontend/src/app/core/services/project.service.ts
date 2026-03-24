import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, ProjectScope } from '../../shared/models/project.model';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { cleanParams } from '../../shared/utils/api.utils';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);

  getProjects(params?: {
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
    sort?: string;
    direction?: string;
  }): Observable<PaginatedResponse<Project>> {
    return this.http.get<PaginatedResponse<Project>>('/api/projects', { params: cleanParams(params) });
  }

  getProject(id: number): Observable<{ data: Project }> {
    return this.http.get<{ data: Project }>(`/api/projects/${id}`);
  }

  createProject(data: Partial<Project>): Observable<{ data: Project }> {
    return this.http.post<{ data: Project }>('/api/projects', data);
  }

  updateProject(id: number, data: Partial<Project>): Observable<{ data: Project }> {
    return this.http.put<{ data: Project }>(`/api/projects/${id}`, data);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`/api/projects/${id}`);
  }

  addScope(projectId: number, data: Partial<ProjectScope>): Observable<{ data: ProjectScope }> {
    return this.http.post<{ data: ProjectScope }>(`/api/projects/${projectId}/scopes`, data);
  }

  updateScope(projectId: number, scopeId: number, data: Partial<ProjectScope>): Observable<{ data: ProjectScope }> {
    return this.http.put<{ data: ProjectScope }>(`/api/projects/${projectId}/scopes/${scopeId}`, data);
  }

  deleteScope(projectId: number, scopeId: number): Observable<void> {
    return this.http.delete<void>(`/api/projects/${projectId}/scopes/${scopeId}`);
  }
}
