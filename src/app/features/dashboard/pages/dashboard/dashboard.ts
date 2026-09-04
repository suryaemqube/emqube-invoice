import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as pbi from 'powerbi-client';
import { DashboardService } from '../../services/dashboard.service';
import { UserService } from '../../../../core/services/user.service';
import { ReportTab } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private userService = inject(UserService);
  private zone = inject(NgZone);

  reportTabs = signal<ReportTab[]>([]);
  activeTabId = signal<number | null>(null);
  loading = signal(true);
  error = signal('');

  private powerbi: pbi.service.Service | null = null;

  ngOnInit(): void {
    this.loadTabs();
  }

  ngOnDestroy(): void {
    this.resetReport();
  }

  onTabClick(tab: ReportTab): void {
    this.activeTabId.set(tab.MenuId);
    this.dashboardService.getAccessToken().subscribe({
      next: (token) => {
        this.zone.runOutsideAngular(() => {
          this.embedReport(tab.MenuURL, token.access_token);
        });
      },
      error: (err) => {
        console.error('Failed to get Power BI access token', err);
        this.error.set('Failed to get access token for Power BI report.');
      },
    });
  }

  private loadTabs(): void {
    this.loading.set(true);
    this.error.set('');
    const profileId = this.userService.profileId || 1;

    this.dashboardService.getReportTabs(profileId).subscribe({
      next: (tabs) => {
        this.reportTabs.set(tabs);
        this.loading.set(false);
        if (tabs.length > 0) {
          setTimeout(() => this.onTabClick(tabs[0]), 0);
        }
      },
      error: (err) => {
        console.error('Failed to load report tabs', err);
        this.error.set('Failed to load dashboard reports.');
        this.loading.set(false);
      },
    });
  }

  private embedReport(reportId: string, accessToken: string): void {
    const container = document.getElementById('biReportTabContent');
    if (!container) return;

    const config: pbi.IReportEmbedConfiguration = {
      type: 'report',
      accessToken,
      embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}`,
      settings: {
        filterPaneEnabled: false,
        navContentPaneEnabled: true,
      },
    };

    if (!this.powerbi) {
      this.powerbi = new pbi.service.Service(
        pbi.factories.hpmFactory,
        pbi.factories.wpmpFactory,
        pbi.factories.routerFactory,
      );
    }

    this.powerbi.reset(container);
    const report = this.powerbi.embed(container, config);
    report.on('loaded', () => {
      console.log('Power BI report loaded');
    });
    report.on('error', (event) => {
      console.error('Power BI report error', event.detail);
    });
  }

  private resetReport(): void {
    const container = document.getElementById('biReportTabContent');
    if (this.powerbi && container) {
      this.powerbi.reset(container);
    }
  }
}
