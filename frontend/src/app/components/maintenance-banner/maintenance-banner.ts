import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-maintenance-banner',
    standalone: true,
    imports: [CommonModule],
    template: `
@if (maintenanceMode()) {
    <div class="banner maintenance">
        <span class="banner-icon">⚠️</span>
        <span class="banner-text">We're currently performing maintenance. Some features may be temporarily unavailable.</span>
    </div>
}
@for (a of announcements(); track a._id) {
    <div class="banner" [class]="'ann-' + a.type">
        <span class="banner-icon">{{ a.type === 'warning' ? '⚠️' : a.type === 'maintenance' ? '🔧' : 'ℹ️' }}</span>
        <span class="banner-text"><strong>{{ a.title }}</strong> — {{ a.message }}</span>
    </div>
}`,
    styles: [`
.banner { display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.6rem 1rem; font-size:0.9rem; font-weight:500; }
.banner.maintenance { background:#f59e0b; color:#1f2937; }
.banner.ann-info { background:#3b82f6; color:#fff; }
.banner.ann-warning { background:#f59e0b; color:#1f2937; }
.banner.ann-maintenance { background:#6366f1; color:#fff; }
.banner-icon { font-size:1.1rem; }
    `]
})
export class MaintenanceBannerComponent implements OnInit {
    maintenanceMode = signal(false);
    announcements = signal<any[]>([]);

    constructor(private http: HttpClient) {}

    async ngOnInit() {
        try {
            const [status, anns] = await Promise.all([
                firstValueFrom(this.http.get<{ maintenanceMode: boolean }>(`${environment.apiUrl}/platform/status`)),
                firstValueFrom(this.http.get<any[]>(`${environment.apiUrl}/platform/announcements/active`))
            ]);
            this.maintenanceMode.set(status.maintenanceMode ?? false);
            this.announcements.set(anns ?? []);
        } catch {
            this.maintenanceMode.set(false);
            this.announcements.set([]);
        }
    }
}
