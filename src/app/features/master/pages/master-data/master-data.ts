import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { EqTable, EqColumn } from '../../../../shared/components/eq-table/eq-table';
import { EqPaginator } from '../../../../shared/components/eq-paginator/eq-paginator';
import { EqBadge } from '../../../../shared/components/eq-badge/eq-badge';
import { EqToolbar } from '../../../../shared/components/eq-toolbar/eq-toolbar';
import { ToastService } from '../../../../shared/services/toast.service';
import { MasterDataService } from '../../services/master-data.service';
import { MasterDataRow, MetaDataModel } from '../../models/master-data.model';

@Component({
  selector: 'app-master-data',
  imports: [FormsModule, EqTable, EqPaginator, EqBadge, EqToolbar],
  templateUrl: './master-data.html',
  styleUrl: './master-data.scss',
})
export class MasterData implements OnInit, OnDestroy {
  private api = inject(MasterDataService);
  private route = inject(ActivatedRoute);
  private modalService = inject(NgbModal);
  private toast = inject(ToastService);

  metaDataId = '';
  title = 'Master Data';

  allRows = signal<MasterDataRow[]>([]);
  columns: EqColumn[] = [];
  bitColumns = new Set<string>();
  filterQuery = signal('');
  page = signal(1);
  pageSize = signal(50);
  loading = signal(true);

  formFields: MetaDataModel[] = [];
  isEditMode = false;
  pendingDeleteRow: MasterDataRow | null = null;

  private paramSub?: Subscription;
  private searchableKeys: string[] = [];

  filteredList = computed(() => {
    let list = this.allRows();
    const q = this.filterQuery().toLowerCase().trim();
    if (q) {
      list = list.filter((row) =>
        this.searchableKeys.some((key) =>
          String(row[key] ?? '').toLowerCase().indexOf(q) > -1,
        ),
      );
    }
    return list;
  });

  pageSlice = computed(() => {
    const list = this.filteredList();
    const start = (this.page() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.paramSub = this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (id && id !== this.metaDataId) {
        this.metaDataId = id;
      }
      this.title = params.get('name') || 'Master Data';
      this.loadList();
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }

  private loadList(): void {
    if (!this.metaDataId) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.page.set(1);
    this.filterQuery.set('');
    this.searchableKeys = [];
    this.api.getList(this.metaDataId).subscribe({
      next: (data) => {
        const rows = data ?? [];
        this.allRows.set(rows);
        this.buildColumns(rows);
        this.loading.set(false);
      },
      error: () => {
        this.allRows.set([]);
        this.columns = [];
        this.loading.set(false);
        this.toast.show('An error occurred while loading data.', 'error');
      },
    });
  }

  private buildColumns(rows: MasterDataRow[]): void {
    this.bitColumns = new Set<string>();
    const cols: EqColumn[] = [];
    if (rows.length > 0) {
      const keys = Object.keys(rows[0]);
      this.searchableKeys = keys;
      for (const key of keys) {
        const values = rows.map((r) => r[key]);
        if (values.every((v) => typeof v === 'boolean')) {
          this.bitColumns.add(key);
        }
        cols.push({ key, header: key });
      }
    }
    cols.push({ key: 'actions', header: 'Action', width: '72px' });
    this.columns = cols;
  }

  cellValue(row: MasterDataRow, key: string): string {
    const v = row[key];
    if (v === null || v === undefined) return '';
    return String(v);
  }

  isBitColumn(key: string): boolean {
    return this.bitColumns.has(key);
  }

  onSearchChange(): void {
    this.page.set(1);
  }

  clearSearch(): void {
    this.filterQuery.set('');
    this.page.set(1);
  }

  // --- add / edit ---

  openAdd(modal: TemplateRef<unknown>): void {
    this.getFormAndOpen('', modal);
  }

  openEdit(row: MasterDataRow, modal: TemplateRef<unknown>): void {
    const primaryKey = String(row['Id'] ?? row['id'] ?? '');
    this.getFormAndOpen(primaryKey, modal);
  }

  private getFormAndOpen(primaryKey: string, modal: TemplateRef<unknown>): void {
    this.api.getForm(this.metaDataId, primaryKey).subscribe({
      next: (res) => {
        if (res?.Error) {
          this.toast.show(res.Error.Text || 'Failed to load record.', 'error');
          return;
        }
        this.formFields = res?.MetaData ?? [];
        this.isEditMode = !!primaryKey;
        this.modalService.open(modal, { centered: true, size: 'lg' });
      },
      error: () => {
        this.toast.show('An error occurred while loading the record.', 'error');
      },
    });
  }

  toggleBit(field: MetaDataModel): void {
    field.FieldValue = field.FieldValue === 'True' ? 'False' : 'True';
  }

  isChecked(field: MetaDataModel): boolean {
    return field.FieldValue === 'True';
  }

  // --- save / delete ---

  save(modal: { close: () => void }): void {
    if (!this.isFormValid()) return;

    const data: MetaDataModel[] = this.formFields.map((f) => ({
      ...f,
      FieldValue:
        f.DataType === 'bit'
          ? f.FieldValue === 'True'
            ? 'True'
            : 'False'
          : f.FieldValue,
    }));

    this.api.addUpdate(this.metaDataId, data).subscribe({
      next: (res) => {
        const type =
          res.MessageTypeValue === 1 ? 'success' : res.MessageTypeValue === 2 ? 'error' : 'warning';
        this.toast.show(res.Text, type);
        if (res.MessageTypeValue === 1) {
          modal.close();
          this.loadList();
        }
      },
      error: () => {
        this.toast.show('An error occurred while saving.', 'error');
      },
    });
  }

  private isFormValid(): boolean {
    for (const f of this.formFields) {
      if (
        f.IsMandatory &&
        (f.FieldValue === null || f.FieldValue === undefined || f.FieldValue === '')
      ) {
        this.toast.show('Please enter all mandatory fields marked in (*).', 'warning');
        return false;
      }
    }
    return true;
  }

  askDelete(row: MasterDataRow, modal: TemplateRef<unknown>): void {
    this.pendingDeleteRow = row;
    this.modalService.open(modal, { centered: true, size: 'sm' });
  }

  deleteLabel(row: MasterDataRow): string {
    const key = this.searchableKeys.find(
      (k) =>
        row[k] !== null &&
        row[k] !== undefined &&
        String(row[k]).trim() !== '' &&
        k.toLowerCase() !== 'id',
    );
    return key ? String(row[key]) : String(row['Id'] ?? '');
  }

  confirmDelete(modal: { close: () => void }): void {
    const row = this.pendingDeleteRow;
    if (!row) return;
    const primaryKey = String(row['Id'] ?? row['id'] ?? '');
    this.api.remove(this.metaDataId, primaryKey).subscribe({
      next: (res) => {
        if (res.MessageTypeValue === 1) {
          this.toast.show(res.Text || 'Deleted successfully.', 'success');
        } else if (res.MessageTypeValue === 3) {
          this.toast.show(
            res.Text?.toLowerCase().includes('used in another')
              ? `Cannot delete "${this.deleteLabel(row)}" — it is used in another record.`
              : (res.Text || 'Cannot delete this record.'),
            'error',
          );
        } else {
          this.toast.show(res.Text || 'An error occurred while deleting.', 'error');
        }
        if (res.MessageTypeValue === 1 || res.MessageTypeValue === 3) {
          this.loadList();
        }
        modal.close();
      },
      error: () => {
        this.toast.show('An error occurred while deleting.', 'error');
        modal.close();
      },
    });
  }
}