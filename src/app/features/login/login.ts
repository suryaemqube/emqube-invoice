import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private userService = inject(UserService);
  private router = inject(Router);
  private toast = inject(ToastService);

  userName = '';
  password = '';
  loading = false;
  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  getLogin(): void {
    if (!this.userName.trim()) {
      this.toast.show('Please enter username.', 'warning');
      return;
    }
    if (!this.password) {
      this.toast.show('Please enter password.', 'warning');
      return;
    }

    this.loading = true;
    this.userService
      .login({
        UserName: this.userName.trim(),
        Password: this.password,
        IPAddress: '',
      })
      .subscribe({
        next: (data) => {
          this.loading = false;
          if (data?.Error == null && data?.Login) {
            this.userService.setUserDetail(data.Login);
            this.router.navigate(['invoicelist']);
          } else {
            this.toast.show(
              data?.Error?.Text ?? 'Wrong username or password.',
              'error',
            );
          }
        },
        error: () => {
          this.loading = false;
          this.toast.show('Some error occurred.', 'error');
        },
      });
  }
}
