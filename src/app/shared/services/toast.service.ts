import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private timeout: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.dismiss();

    const el = document.createElement('div');
    el.className = `eq-toast eq-toast--${type}`;
    el.textContent = message;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add('show'));

    this.timeout = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 200);
    }, 3500);
  }

  dismiss(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    document.querySelectorAll('.eq-toast').forEach((el) => el.remove());
  }
}
