import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppRuntimeConfig {
  apiUrl: string;
  fileBaseUrl: string;
}

/**
 * Loads UAT/LIVE runtime configuration from `config.json` (served from `/` and
 * editable at deploy time without rebuilding). Falls back to `environment.ts`
 * when the file is missing or unreadable. Resolved once during app bootstrap
 * via `APP_INITIALIZER` so the same build can target the UAT or LIVE backend.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);

  private config: AppRuntimeConfig | null = null;

  load(): Promise<void> {
    return firstValueFrom(this.http.get<AppRuntimeConfig>('config.json'))
      .then((cfg) => {
        this.config = cfg ?? this.fallback();
      })
      .catch(() => {
        this.config = this.fallback();
      });
  }

  private fallback(): AppRuntimeConfig {
    const apiUrl = environment.apiUrl;
    return {
      apiUrl,
      fileBaseUrl: apiUrl.replace(/\/api$/, ''),
    };
  }

  get apiUrl(): string {
    return this.config?.apiUrl ?? environment.apiUrl;
  }

  /** Origin/document root for PDF / document downloads (no trailing /api). */
  get fileBaseUrl(): string {
    return this.config?.fileBaseUrl ?? this.apiUrl.replace(/\/api$/, '');
  }
}
