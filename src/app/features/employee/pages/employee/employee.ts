import { Component, OnInit, inject, computed, signal, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EqTable, EqColumn } from '../../../../shared/components/eq-table/eq-table';
import { EqPaginator } from '../../../../shared/components/eq-paginator/eq-paginator';
import { EqBadge } from '../../../../shared/components/eq-badge/eq-badge';
import { EqToolbar } from '../../../../shared/components/eq-toolbar/eq-toolbar';
import { ToastService } from '../../../../shared/services/toast.service';
import { UserService } from '../../../../core/services/user.service';
import { EmployeeService } from '../../services/employee.service';
import { ParameterModel } from '../../../invoices/models/invoice.model';
import {
  EmployeeListModel,
  EmployeeModel,
  RoleModel,
  emptyEmployeeModel,
} from '../../models/employee.model';

@Component({
  selector: 'app-employee',
  imports: [FormsModule, EqTable, EqPaginator, EqBadge, EqToolbar],
  templateUrl: './employee.html',
  styleUrl: './employee.scss',
})
export class Employee implements OnInit {
  private api = inject(EmployeeService);
  private modalService = inject(NgbModal);
  private toast = inject(ToastService);
  private user = inject(UserService);

  allEmployees = signal<EmployeeListModel[]>([]);
  roleList: RoleModel[] = [];
  userTypeList: ParameterModel[] = [];
  departmentList: ParameterModel[] = [];

  statusFilter = signal<'active' | 'inactive'>('active');

  filterQuery = signal('');

  page = signal(1);
  pageSize = signal(10);

  loading = signal(true);

  modalData: EmployeeModel = emptyEmployeeModel();

  columns: EqColumn[] = [
    { key: 'Name', header: 'Name' },
    { key: 'Department', header: 'Department' },
    { key: 'Email', header: 'Email' },
    { key: 'UserName', header: 'UserName' },
    { key: 'UserStatus', header: 'UserStatus' },
    { key: 'actions', header: '', align: 'right', width: '50px' },
  ];

  filteredList = computed(() => {
    let list = this.allEmployees();
    const active = this.statusFilter() === 'active';
    list = list.filter((row) => (row.IsActive ? active === true : active === false));
    const q = this.filterQuery().toLowerCase().trim();
    if (q) {
      list = list.filter((row) =>
        [row.FirstName, row.LastName, `${row.FirstName} ${row.LastName}`.trim(), row.Email, row.UserName ?? '']
          .filter(Boolean)
          .some((f) => f.toLowerCase().indexOf(q) > -1),
      );
    }
    return list;
  });

  pageSlice = computed(() => {
    const list = this.filteredList();
    const start = (this.page() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  fullName(row: EmployeeListModel): string {
    return `${row.FirstName} ${row.LastName}`.trim();
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.api.getEmployeeList().subscribe({
      next: (data) => {
        this.allEmployees.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
    this.loadMasters();
  }

  private loadMasters(): void {
    this.api.getRoleList().subscribe({
      next: (data) => {
        this.roleList = data ?? [];
      },
      error: () => {
        this.roleList = [];
      },
    });
    this.api.getParameters(8).subscribe({
      next: (res) => {
        this.userTypeList = res?.ParameterList ?? [];
      },
      error: () => {
        this.userTypeList = [];
      },
    });
    this.api.getParameters(11).subscribe({
      next: (res) => {
        this.departmentList = res?.ParameterList ?? [];
      },
      error: () => {
        this.departmentList = [];
      },
    });
  }

  onStatusChange(): void {
    this.page.set(1);
  }

  onSearchChange(): void {
    this.page.set(1);
  }

  clearSearch(): void {
    this.filterQuery.set('');
    this.page.set(1);
  }

  isEditMode(): boolean {
    return this.modalData.EmployeeId > 0;
  }

  // --- add / edit ---

  openAdd(modal: TemplateRef<unknown>): void {
    this.modalData = emptyEmployeeModel();
    this.modalData.LoggedInUserId = this.user.profileId || null;
    this.modalService.open(modal, { centered: true, size: 'lg' });
  }

  openEdit(row: EmployeeListModel, modal: TemplateRef<unknown>): void {
    this.modalData = {
      EmployeeId: row.EmployeeId,
      ProfileId: row.ProfileId,
      LoggedInUserId: this.user.profileId ?? null,
      FirstName: row.FirstName ?? '',
      LastName: row.LastName ?? '',
      Email: row.Email ?? '',
      Phone: row.Phone ?? null,
      Designation: row.Designation ?? null,
      DepartmentValue: row.DepartmentValue ?? null,
      UserTypeValue: row.UserTypeValue ?? null,
      SiteAccess: row.SiteAccess ?? null,
      UserName: row.UserName ?? null,
      Password: row.Password ?? null,
      RoleId: row.RoleId ?? null,
      IsActive: row.IsActive ?? null,
    };
    this.modalService.open(modal, { centered: true, size: 'lg' });
  }

  // --- save ---

  saveEmployee(modal: { close: () => void }): void {
    if (!this.isFormValid()) return;

    this.modalData.LoggedInUserId = this.user.profileId ?? null;

    this.api.addUpdateEmployee(this.modalData).subscribe({
      next: (res) => {
        const type = res.MessageTypeValue === 1 ? 'success' : res.MessageTypeValue === 2 ? 'error' : 'warning';
        this.toast.show(res.Text, type);
        modal.close();
        if (res.MessageTypeValue === 1) {
          this.refreshList();
        }
      },
      error: () => {
        this.toast.show('An error occurred while saving the employee.', 'error');
      },
    });
  }

  isFormValid(): boolean {
    const m = this.modalData;

    const require = (ok: boolean, msg: string): boolean => {
      if (!ok) {
        this.toast.show(msg, 'warning');
        return false;
      }
      return true;
    };

    if (!require(!!(m.FirstName && m.FirstName.trim()), 'Please enter name')) return false;
    if (!require(!!(m.LastName && m.LastName.trim()), 'Please enter last name')) return false;
    if (!require(!!(m.Email && m.Email.trim()), 'Please enter email')) return false;
    if (!require(this.isValidEmail(m.Email), 'Please enter email in correct format')) return false;
    if (!require(m.UserTypeValue != null && m.UserTypeValue !== 0, 'Please select user type')) return false;
    if (m.SiteAccess) {
      if (!require(m.RoleId != null && m.RoleId !== 0, 'Please select role')) return false;
      if (!require(m.IsActive != null, 'Please select status')) return false;
      if (!require(!!(m.UserName && m.UserName.trim()), 'Please enter username')) return false;
      if (!require(!!(m.Password && m.Password.trim()), 'Please enter password')) return false;
    }
    return true;
  }

  private isValidEmail(email: string): boolean {
    // eslint-disable-next-line no-useless-escape
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  private refreshList(): void {
    this.loading.set(true);
    this.api.getEmployeeList().subscribe({
      next: (data) => {
        this.allEmployees.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
