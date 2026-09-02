import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuListItem } from '../../../core/models/menu.model';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  salesMenus = input<MenuListItem[]>([]);
  masterMenus = input<MenuListItem[]>([]);
  menuClick = output<string>();

  cssClassFor(cssClass: string | undefined): string {
    return cssClass?.trim() || 'icon-doc';
  }

  onMenuClick(pageUrl: string): void {
    this.menuClick.emit(pageUrl);
  }
}
