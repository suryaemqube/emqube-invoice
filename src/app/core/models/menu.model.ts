export interface MenuItem {
  MenuId: number;
  Name: string;
  ParentId: number | null;
  DisplayOrder: number | null;
  MenuURL: string;
  CssClass: string;
  MenuGroup: string;
}

export interface MenuListItem {
  ParentMenu: {
    MenuName: string;
    PageUrl: string;
  };
  Childmenu: unknown[];
}
