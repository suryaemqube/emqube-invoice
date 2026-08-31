import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'eq-paginator',
  imports: [FormsModule, NgbPaginationModule],
  template: `
    <div class="eq-table-footer">
      <span class="eq-table-count">
        {{ totalItems() }} {{ totalItems() === 1 ? 'row' : 'rows' }}
      </span>
      <div class="eq-paginator">
        <select
          class="form-select eq-page-size"
          [ngModel]="pageSize()"
          (ngModelChange)="pageSizeChange.emit($event)"
        >
          @for (size of pageSizeOptions(); track size) {
            <option [value]="size">{{ size }}</option>
          }
        </select>
        <ngb-pagination
          [collectionSize]="totalItems()"
          [page]="page()"
          [pageSize]="pageSize()"
          [maxSize]="5"
          [boundaryLinks]="true"
          (pageChange)="pageChange.emit($event)"
        />
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .eq-page-size {
      width: auto;
      height: 30px;
      padding: 0 var(--eq-sp-3);
      font-size: 12.5px;
    }
  `,
})
export class EqPaginator {
  totalItems = input(0);
  page = input(1);
  pageSize = input(100);
  pageSizeOptions = input([50, 100, 150]);

  pageChange = output<number>();
  pageSizeChange = output<number>();
}
