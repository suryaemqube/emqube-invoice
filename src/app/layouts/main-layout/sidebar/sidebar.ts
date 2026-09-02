import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuListItem } from '../../../core/models/menu.model';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private router = inject(Router);

  salesMenus = input<MenuListItem[]>([]);
  masterMenus = input<MenuListItem[]>([]);
  menuClick = output<string>();

  cssClassFor(cssClass: string | undefined): string {
    return cssClass?.trim() || 'icon-doc';
  }

  onMenuClick(pageUrl: string): void {
    this.menuClick.emit(pageUrl);
  }

  isActive(pageUrl: string): boolean {
    const url = this.router.url.split('?')[0];
    const urlPath = url.split(';')[0];
    if (pageUrl.includes(',')) {
      const parts = pageUrl.replace(/^\//, '').split(',');
      const basePath = '/' + parts[0];
      const pageId = parts[1];
      const urlId = this.getMatrixParam(url, 'id');
      return urlPath === basePath && urlId === pageId;
    }
    return urlPath === '/' + pageUrl.replace(/^\//, '');
  }

  private getMatrixParam(url: string, key: string): string | null {
    const match = url.match(new RegExp(`[;?]${key}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
}
