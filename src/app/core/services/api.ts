import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private http = inject(HttpClient);

  post<T>(controller: string, action: string, body: unknown = null): Observable<T> {
    return this.http.post<T>(
      `${environment.apiUrl}/${controller}/${action}`,
      body
    );
  }
}
