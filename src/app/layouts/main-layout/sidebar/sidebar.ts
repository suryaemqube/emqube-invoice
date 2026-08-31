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

  private menuIcons: Record<string, string> = {
    'Dashboard': 'icon-speedometer',
    'Invoice': 'icon-doc',
    'Quote / Proforma': 'icon-note',
    'Customer': 'icon-people',
    'Employee': 'icon-user',
    'Executives': 'icon-star',
    'Product': 'icon-basket',
    'ProductCategory': 'icon-tag',
    'PaymentTerm': 'icon-wallet',
    'Create Quotation': 'icon-plus',
    'Quotation List': 'icon-list',
    'Invoice Report': 'icon-chart',
  };

  iconFor(menuName: string | undefined): string {
    if (!menuName) return 'icon-doc';
    return this.menuIcons[menuName.trim()] || 'icon-doc';
  }

  onMenuClick(pageUrl: string): void {
    this.menuClick.emit(pageUrl);
  }
}
