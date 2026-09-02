import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api';
import { UserService } from '../../core/services/user.service';
import { MenuListItem } from '../../core/models/menu.model';
import { Sidebar } from './sidebar/sidebar';
import { Profile } from './profile/profile';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, Sidebar, Profile],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  private userService = inject(UserService);

  menuList: MenuListItem[] = [];
  salesMenus: MenuListItem[] = [];
  masterMenus: MenuListItem[] = [];
  activeMenu = '';

  get hasMenus(): boolean {
    return this.salesMenus.length > 0 || this.masterMenus.length > 0;
  }

  ngOnInit(): void {
    this.loadMenu();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('eq-sidebar-compact');
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth >= 992) {
      this.closeMobileSidebar();
    }
  }

  toggleSidebar(): void {
    document.body.classList.toggle('eq-sidebar-compact');
  }

  toggleMobileSidebar(): void {
    document.body.classList.toggle('eq-sidebar-mobile-show');
  }

  closeMobileSidebar(): void {
    document.body.classList.remove('eq-sidebar-mobile-show');
  }

  private loadMenu(): void {
    const roleId = this.userService.roleId || 1;
    this.api.post<MenuListItem[]>('Common', 'GetSiteUserMenuList', roleId).subscribe({
      next: (data) => {
        this.menuList = data ?? [];
        this.buildMenuGroups();
      },
      error: () => {
        this.menuList = [
          { ParentMenu: { MenuItemId: 1, MenuName: 'Dashboard', PageUrl: 'dashboard', CssClass: 'icon-speedometer', MenuGroup: 'Sales' }, Childmenu: [] },
          { ParentMenu: { MenuItemId: 10, MenuName: 'Invoice', PageUrl: 'invoicelist', CssClass: 'icon-doc', MenuGroup: 'Sales' }, Childmenu: [] },
          { ParentMenu: { MenuItemId: 3, MenuName: 'Quote / Proforma', PageUrl: 'quotelist', CssClass: 'icon-note', MenuGroup: 'Sales' }, Childmenu: [] },
          { ParentMenu: { MenuItemId: 4, MenuName: 'Customer', PageUrl: 'customerlist', CssClass: 'icon-people', MenuGroup: 'Sales' }, Childmenu: [] },
          { ParentMenu: { MenuItemId: 6, MenuName: 'Product', PageUrl: 'master,1,Product', CssClass: 'icon-basket', MenuGroup: 'Master Data' }, Childmenu: [] },
          { ParentMenu: { MenuItemId: 7, MenuName: 'ProductCategory', PageUrl: 'master,2,ProductCategory', CssClass: 'icon-tag', MenuGroup: 'Master Data' }, Childmenu: [] },
          { ParentMenu: { MenuItemId: 8, MenuName: 'PaymentTerm', PageUrl: 'master,3,PaymentTerm', CssClass: 'icon-wallet', MenuGroup: 'Master Data' }, Childmenu: [] },
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
      const group = (item.ParentMenu.MenuGroup || '').trim().toLowerCase();
      if (group === 'sales') {
        sales.push(item);
      } else {
        master.push(item);
      }
    }
    this.salesMenus = sales;
    this.masterMenus = master;

    if (this.hasMenus) {
      document.body.classList.remove('eq-no-sidebar');
    } else {
      document.body.classList.add('eq-no-sidebar');
    }
  }

  onMenuClick(pageUrl: string): void {
    this.closeMobileSidebar();
    if (pageUrl.includes(',')) {
      const parts = pageUrl.split(',');
      this.router.navigate([parts[0], { id: parts[1], name: parts[2] }]);
    } else {
      this.router.navigate([pageUrl]);
    }
  }
}
