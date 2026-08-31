import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ApiService } from '../../core/services/api';
import { MenuListItem } from '../../core/models/menu.model';
import { Sidebar } from './sidebar/sidebar';
import { Profile } from './profile/profile';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Profile],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);

  menuList: MenuListItem[] = [];
  salesMenus: MenuListItem[] = [];
  masterMenus: MenuListItem[] = [];
  activeMenu = '';

  ngOnInit(): void {
    document.body.classList.add('eq-sidebar-compact');
    this.loadMenu();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('eq-sidebar-compact');
  }

  toggleSidebar(): void {
    document.body.classList.toggle('eq-sidebar-compact');
  }

  private loadMenu(): void {
    this.api.post<MenuListItem[]>('Common', 'GetSiteUserMenuList', 1).subscribe({
      next: (data) => {
        this.menuList = data ?? [];
        this.buildMenuGroups();
      },
      error: () => {
        this.menuList = [
          { ParentMenu: { MenuName: 'Dashboard', PageUrl: 'dashboard' }, Childmenu: [] },
          { ParentMenu: { MenuName: 'Invoice', PageUrl: 'invoicelist' }, Childmenu: [] },
          { ParentMenu: { MenuName: 'Quote / Proforma', PageUrl: 'quotelist' }, Childmenu: [] },
          { ParentMenu: { MenuName: 'Customer', PageUrl: 'customerlist' }, Childmenu: [] },
          { ParentMenu: { MenuName: 'Product', PageUrl: 'master,1,Product' }, Childmenu: [] },
          { ParentMenu: { MenuName: 'ProductCategory', PageUrl: 'master,2,ProductCategory' }, Childmenu: [] },
          { ParentMenu: { MenuName: 'PaymentTerm', PageUrl: 'master,3,PaymentTerm' }, Childmenu: [] },
        ];
        this.buildMenuGroups();
      },
    });
  }

  private buildMenuGroups(): void {
    const sales: MenuListItem[] = [];
    const master: MenuListItem[] = [];
    for (const item of this.menuList) {
      if (!item?.ParentMenu) continue;
      const name = item.ParentMenu.MenuName;
      if (name === 'Dashboard' || name === 'Invoice' || name === 'Quote / Proforma' || name === 'Customer') {
        sales.push(item);
      } else {
        master.push(item);
      }
    }
    this.salesMenus = sales;
    this.masterMenus = master;
  }

  onMenuClick(pageUrl: string): void {
    if (pageUrl.includes(',')) {
      const parts = pageUrl.split(',');
      this.router.navigate([parts[0], { id: parts[1], name: parts[2] }]);
    } else {
      this.router.navigate([pageUrl]);
    }
  }
}
