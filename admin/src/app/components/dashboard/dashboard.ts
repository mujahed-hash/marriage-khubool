import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../services/admin-api';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
<div class="dashboard">
    @if (loading()) {
        <div class="loading">Loading stats...</div>
    } @else {
        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-body">
                    <div class="stat-value">{{ stats().totalUsers | number }}</div>
                    <div class="stat-label">Total Users</div>
                    <div class="stat-sub">+{{ stats().newUsersToday }} today</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👤</div>
                <div class="stat-body">
                    <div class="stat-value">{{ stats().totalProfiles | number }}</div>
                    <div class="stat-label">Active Profiles</div>
                    <div class="stat-sub">+{{ stats().newUsersThisWeek }} this week</div>
                </div>
            </div>
            <div class="stat-card warn">
                <div class="stat-icon">🚩</div>
                <div class="stat-body">
                    <div class="stat-value">{{ stats().pendingReports }}</div>
                    <div class="stat-label">Pending Reports</div>
                    <div class="stat-sub">Requires review</div>
                </div>
            </div>
            <div class="stat-card green">
                <div class="stat-icon">💳</div>
                <div class="stat-body">
                    <div class="stat-value">₹{{ stats().revenueTotal | number }}</div>
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-sub">{{ stats().totalOrders }} orders</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💑</div>
                <div class="stat-body">
                    <div class="stat-value">{{ stats().totalInterests | number }}</div>
                    <div class="stat-label">Interests Sent</div>
                    <div class="stat-sub">{{ stats().acceptedInterests }} accepted</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-body">
                    <div class="stat-value">{{ stats().newUsersThisMonth | number }}</div>
                    <div class="stat-label">New This Month</div>
                    <div class="stat-sub">Registrations</div>
                </div>
            </div>
        </div>

        <!-- Registrations Chart -->
        <div class="chart-card">
            <h3>Registrations — Last 30 Days</h3>
            @if (stats().registrationChart?.length) {
                <div class="bar-chart">
                    @for (day of stats().registrationChart; track day._id) {
                        <div class="bar-col" [title]="day._id + ': ' + day.count + ' users'">
                            <div class="bar-fill" [style.height.%]="(day.count / maxReg()) * 100"></div>
                            <span class="bar-label">{{ day._id.slice(8) }}</span>
                        </div>
                    }
                </div>
            } @else {
                <p class="empty">No registration data yet.</p>
            }
        </div>
    }
</div>`,
    styles: [`
.dashboard { display:flex; flex-direction:column; gap:2rem; }
.loading { color:#94a3b8; text-align:center; padding:4rem; font-size:1.1rem; }
.stats-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:1.25rem; }
.stat-card { background:#1e293b; border-radius:12px; padding:1.5rem; display:flex; align-items:flex-start; gap:1rem; border:1px solid #334155; transition:border-color 0.2s; }
.stat-card:hover { border-color:#6366f1; }
.stat-card.warn { border-left:4px solid #f59e0b; }
.stat-card.green { border-left:4px solid #10b981; }
.stat-icon { font-size:2rem; }
.stat-value { font-size:1.75rem; font-weight:800; color:#f1f5f9; line-height:1; }
.stat-label { color:#64748b; font-size:0.8rem; font-weight:600; text-transform:uppercase; letter-spacing:.5px; margin-top:0.25rem; }
.stat-sub { color:#94a3b8; font-size:0.8rem; margin-top:0.25rem; }
.chart-card { background:#1e293b; border-radius:12px; padding:1.5rem; border:1px solid #334155; }
h3 { color:#f1f5f9; margin:0 0 1.5rem; font-size:1rem; }
.bar-chart { display:flex; align-items:flex-end; gap:3px; height:120px; overflow-x:auto; padding-bottom:1.5rem; position:relative; }
.bar-col { display:flex; flex-direction:column; align-items:center; gap:0.25rem; min-width:18px; flex:1; height:100%; justify-content:flex-end; }
.bar-fill { width:100%; background:#6366f1; border-radius:3px 3px 0 0; min-height:2px; transition:height 0.3s; }
.bar-label { color:#64748b; font-size:0.6rem; white-space:nowrap; }
.empty { color:#64748b; font-size:0.9rem; }
    `]
})
export class DashboardComponent implements OnInit {
    loading = signal(true);
    stats = signal<any>({ totalUsers: 0, totalProfiles: 0, newUsersToday: 0, newUsersThisWeek: 0, newUsersThisMonth: 0, pendingReports: 0, totalOrders: 0, revenueTotal: 0, totalInterests: 0, acceptedInterests: 0, registrationChart: [] });
    maxReg = signal(1);

    constructor(private api: AdminApiService) { }

    async ngOnInit() {
        try {
            const data = await this.api.getStats();
            this.stats.set(data);
            const max = Math.max(...(data.registrationChart?.map((d: any) => d.count) || [1]), 1);
            this.maxReg.set(max);
        } catch { }
        this.loading.set(false);
    }
}
