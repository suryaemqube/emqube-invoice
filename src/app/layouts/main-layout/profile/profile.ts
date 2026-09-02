import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private router = inject(Router);
  private el = inject(ElementRef);
  private userService = inject(UserService);

  isOpen = false;

  get userDetail() {
    const detail = this.userService.userDetail;
    return {
      FirstName: detail?.FirstName ?? 'User',
      LastName: detail?.LastName ?? '',
      RoleName: detail?.RoleName ?? '',
      LastLogin: detail ? this.formatLogin(detail.LastLogin) : null,
      UserName: detail?.UserName ?? '',
    };
  }

  get loginTime(): string {
    const detail = this.userService.userDetail;
    if (!detail?.LastLogin) return '';
    const d = new Date(detail.LastLogin);
    if (isNaN(d.getTime())) return detail.LastLogin;
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
  }

  private formatLogin(value: string | null): string | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggle(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  logout(): void {
    this.close();
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  changePassword(): void {
    this.close();
    this.router.navigate(['/changepassword']);
  }

  private close(): void {
    this.isOpen = false;
  }
}
