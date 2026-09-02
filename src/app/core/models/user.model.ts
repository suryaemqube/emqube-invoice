export interface UserDetail {
  ProfileId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  AddressId: number | null;
  UserTypeId: number;
  UserTypeValue: number;
  UserType: string;
  SiteUserId: number;
  UserName: string;
  Password: string;
  RoleId: number;
  IsActive: boolean;
  RoleName: string;
  Address: string;
  CityName: string;
  StateId: number | null;
  Zipcode: string;
  StateName: string;
  FailedLoginAttemptCount: number | null;
  FailedLoginAttemptDate: string | null;
  LastLogin: string | null;
  PasswodChanged: string | null;
}

export interface LoginModel {
  UserName: string;
  Password: string;
  IPAddress: string;
}

export interface LoginResponse {
  Error: { Code: number; Text: string; MessageTypeValue: number } | null;
  Login: UserDetail | null;
}

export interface ChangePasswordModel {
  userId: number;
  OldPassword: string;
  NewPassword: string;
  ConfirmPassword: string;
}
