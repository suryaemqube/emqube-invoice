import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import { UserDetail, LoginModel, LoginResponse, ChangePasswordModel } from '../models/user.model';

const STORAGE_KEY = 'userDetails';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private api = inject(ApiService);

  get userDetail(): UserDetail | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserDetail) : null;
    } catch {
      return null;
    }
  }

  get roleId(): number {
    return this.userDetail?.RoleId ?? 0;
  }

  get profileId(): number {
    return this.userDetail?.ProfileId ?? 0;
  }

  get isLoggedIn(): boolean {
    return !!this.userDetail;
  }

  login(model: LoginModel): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('Common', 'GetLogin', model);
  }

  setUserDetail(detail: UserDetail): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(detail));
  }

  changePassword(model: ChangePasswordModel) {
    return this.api.post<{ Code: number; Text: string; MessageTypeValue: number }>(
      'Common',
      'ChangePassword',
      model,
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
