import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-page-placeholder',
  template: `
    <div class="eq-page-header">
      <div>
        <h1>{{ title }}</h1>
      </div>
    </div>
    <div class="eq-empty">
      <div class="eq-empty-icon"><i [class]="icon"></i></div>
      <h2>{{ title }}</h2>
      <p>This page will be built in a later phase.</p>
    </div>
  `,
})
export class PagePlaceholder {
  private route = inject(ActivatedRoute);

  title = this.route.snapshot.data['title'] ?? 'Page';
  icon = this.route.snapshot.data['icon'] ?? 'icon-doc';
}
