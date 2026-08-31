import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private router = inject(Router);
  private el = inject(ElementRef);

  isOpen = false;

  userDetail = {
    FirstName: 'User',
    LastName: '',
    RoleName: 'Admin',
    LastLogin: null as string | null,
  };

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
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  private close(): void {
    this.isOpen = false;
  }
}
