import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'eq-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="eq-badge" [class.eq-badge-sm]="compact()" [ngClass]="'eq-badge-' + tone()">
      <ng-content />
    </span>
  `,
})
export class EqBadge {
  tone = input.required<BadgeTone>();
  compact = input(false);
}
