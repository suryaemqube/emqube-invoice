import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private http = inject(HttpClient);
  private config = inject(ConfigService);

  post<T>(controller: string, action: string, body: unknown = null): Observable<T> {
    return this.http.post<T>(
      `${this.config.apiUrl}/${controller}/${action}`,
      body
    );
  }
}
