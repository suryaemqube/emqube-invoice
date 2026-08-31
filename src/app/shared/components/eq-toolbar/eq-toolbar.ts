import { Component } from '@angular/core';

@Component({
  selector: 'eq-toolbar',
  standalone: true,
  template: `
    <div class="eq-toolbar">
      <ng-content />
    </div>
  `,
})
export class EqToolbar {}
