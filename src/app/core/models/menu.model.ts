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
    MenuItemId: number;
    MenuName: string;
    MenuParentId?: number | null;
    MenuOrder?: number | null;
    PageUrl: string;
    CssClass?: string;
    MenuGroup?: string;
    DepartmentId?: number | null;
    RightDelete?: boolean | null;
    RightEdit?: boolean | null;
    RightCreate?: boolean | null;
    RightView?: boolean | null;
  };
  Childmenu: MenuListItem['ParentMenu'][];
}
