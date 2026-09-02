export interface EmployeeListModel {
  EmployeeId: number;
  ProfileId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string | null;
  Designation: string | null;
  DepartmentText: string | null;
  DepartmentValue: number | null;
  UserName: string | null;
  UserType: string | null;
  UserTypeValue: number | null;
  RoleId: number | null;
  RoleName: string | null;
  SiteAccess: boolean | null;
  IsActive: boolean | null;
  SiteUserId: number | null;
  ReportingTo: number | null;
  Password: string | null;
  LastLogin: string | null;
}

export interface EmployeeModel {
  EmployeeId: number;
  ProfileId: number;
  LoggedInUserId: number | null;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string | null;
  Designation: string | null;
  DepartmentValue: number | null;
  UserTypeValue: number | null;
  SiteAccess: boolean | null;
  UserName: string | null;
  Password: string | null;
  RoleId: number | null;
  IsActive: boolean | null;
}

export function emptyEmployeeModel(): EmployeeModel {
  return {
    EmployeeId: 0,
    ProfileId: 0,
    LoggedInUserId: null,
    FirstName: '',
    LastName: '',
    Email: '',
    Phone: null,
    Designation: null,
    DepartmentValue: null,
    UserTypeValue: null,
    SiteAccess: null,
    UserName: null,
    Password: null,
    RoleId: null,
    IsActive: null,
  };
}

export interface RoleModel {
  RoleId: number;
  RoleName: string;
}

export interface ParameterOption {
  ParameterValue: number;
  Text: string;
}
