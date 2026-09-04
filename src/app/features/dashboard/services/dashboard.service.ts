import { Injectable, inject } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api';
import {
  ReportTab,
  ReportTabListResponse,
  BIAccessToken,
  BIAccessTokenResponse,
} from '../models/dashboard.model';

const TOKEN_CACHE_KEY = 'BIAccessDetails';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(ApiService);

  getReportTabs(profileId: number): Observable<ReportTab[]> {
    return this.api
      .post<ReportTabListResponse>('Common', 'GetSiteuserMenuListModel', {
        ProfileId: profileId,
        MenuValueId: 14,
      })
      .pipe(map((res) => res?.MenuList ?? []));
  }

  getAccessToken(): Observable<BIAccessToken> {
    const cached = this.getCachedToken();
    if (cached) {
      return of(cached);
    }
    return this.api
      .post<BIAccessTokenResponse>('Common', 'GetAccessToken', null)
      .pipe(map((res) => res.AccessToken))
      .pipe(
        tap((token) => {
          localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(token));
        }),
      );
  }

  private getCachedToken(): BIAccessToken | null {
    try {
      const raw = localStorage.getItem(TOKEN_CACHE_KEY);
      if (!raw) return null;
      const token: BIAccessToken = JSON.parse(raw);
      const nowSeconds = Date.now() / 1000;
      if (token.expires_on && Number(token.expires_on) > nowSeconds) {
        return token;
      }
      return null;
    } catch {
      return null;
    }
  }
}
