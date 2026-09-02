import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api';
import { InvoiceMessage, RParameterList } from '../../invoices/models/invoice.model';
import { EmployeeListModel, EmployeeModel, RoleModel } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private api = inject(ApiService);

  getEmployeeList() {
    return this.api.post<EmployeeListModel[]>('Common', 'GetEmployeeList', null);
  }

  addUpdateEmployee(model: EmployeeModel) {
    return this.api.post<InvoiceMessage>('Common', 'AddUpdateEmployee', model);
  }

  getRoleList() {
    return this.api.post<RoleModel[]>('Common', 'GetRoleList', null);
  }

  getParameters(type: number) {
    return this.api.post<RParameterList>('Common', 'GetParameters', type);
  }
}
