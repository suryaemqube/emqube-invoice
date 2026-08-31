import { Component, input, output } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

export interface EqDropdownItem {
  icon: string;
  label: string;
  disabled?: boolean;
  cssClass?: string;
}

@Component({
  selector: 'eq-dropdown',
  imports: [NgbDropdownModule],
  template: `
    <div ngbDropdown container="body" display="dynamic" placement="bottom-end">
      <button
        type="button"
        class="eq-icon-btn"
        ngbDropdownToggle
        title="Actions"
      >
        <i class="icon-options-vertical"></i>
      </button>
      <div ngbDropdownMenu class="eq-row-menu">
        @for (item of items(); track item.label) {
          <button
            ngbDropdownItem
            [disabled]="item.disabled ?? false"
            [class]="item.cssClass"
            (click)="itemClick.emit(item)"
          >
            <i [class]="item.icon"></i>
            {{ item.label }}
          </button>
        }
      </div>
    </div>
  `,
})
export class EqDropdown {
  items = input.required<EqDropdownItem[]>();
  itemClick = output<EqDropdownItem>();
}
