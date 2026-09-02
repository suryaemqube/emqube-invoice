import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-change-password',
  imports: [FormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword {
  private userService = inject(UserService);
  private router = inject(Router);
  private toast = inject(ToastService);

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  passVisible: Record<'old' | 'new' | 'confirm', boolean> = {
    old: false,
    new: false,
    confirm: false,
  };

  togglePassword(field: 'old' | 'new' | 'confirm'): void {
    this.passVisible[field] = !this.passVisible[field];
  }

  save(): void {
    if (this.loading) return;

    if (!this.oldPassword) {
      this.toast.show('Please enter your old password.', 'warning');
      return;
    }

    if (!this.newPassword) {
      this.toast.show('Please enter a new password.', 'warning');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toast.show('New password and confirm password should be the same.', 'error');
      return;
    }

    this.loading = true;
    this.userService
      .changePassword({
        userId: this.userService.profileId,
        OldPassword: this.oldPassword,
        NewPassword: this.newPassword,
        ConfirmPassword: this.confirmPassword,
      })
      .subscribe({
        next: (data) => {
          this.loading = false;
          this.toast.show(data?.Text ?? '', data?.MessageTypeValue === 1 ? 'success' : 'error');
          if (data?.MessageTypeValue === 1) {
            this.router.navigate(['invoicelist']);
          }
        },
        error: () => {
          this.loading = false;
          this.toast.show('Some error occurred.', 'error');
        },
      });
  }

  backToList(): void {
    this.router.navigate(['invoicelist']);
  }
}
