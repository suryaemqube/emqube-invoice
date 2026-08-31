import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

export interface EqColumn {
  key: string;
  header: string;
  cssClass?: string;
  align?: 'left' | 'right';
  width?: string;
}

@Component({
  selector: 'eq-table',
  imports: [NgClass],
  template: `
    <div class="eq-table-card">
      <div class="eq-table-scroll">
        <table class="eq-table">
          <thead>
            <tr>
              @for (col of columns(); track col.key) {
                <th
                  [ngClass]="col.cssClass"
                  [style.text-align]="col.align === 'right' ? 'right' : undefined"
                  [style.width]="col.width"
                >
                  {{ col.header }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              @for (row of skeletonRows; track row) {
                <tr>
                  @for (col of columns(); track col.key) {
                    <td>
                      <div class="eq-skeleton-row" [style.--i]="row"></div>
                    </td>
                  }
                </tr>
              }
            } @else {
              <ng-content select="[eqTableBody]" />
            }
          </tbody>
        </table>
      </div>
      <ng-content select="[eqTableFoot]" />
    </div>
  `,
  styles: `
    :host { display: block; }
    .eq-skeleton-row {
      height: 16px;
      border-radius: var(--eq-radius-control);
      background: linear-gradient(90deg, var(--eq-surface-alt) 25%, var(--eq-border) 37%, var(--eq-surface-alt) 63%);
      background-size: 400% 100%;
      animation: eq-shimmer 1.4s ease infinite;
      animation-delay: calc(var(--i) * 0.08s);
    }
    @keyframes eq-shimmer {
      0% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .eq-skeleton-row { animation: none; }
    }
  `,
})
export class EqTable {
  columns = input.required<EqColumn[]>();
  loading = input(false);

  skeletonRows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
}
