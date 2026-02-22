import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="reports-page">
    <div class="filters">
        <select [(ngModel)]="filterStatus" (ngModelChange)="load()" class="select-filter">
            <option value="">Pending only</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
        </select>
    </div>

    <div class="table-card">
        @if (loading()) {
            <div class="loading">Loading reports...</div>
        } @else {
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Reporter</th>
                        <th>Reported Profile</th>
                        <th>Reason</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @for (r of reports(); track r._id) {
                        <tr [class.row-pending]="!r.status || r.status === 'pending'"
                            [class.row-resolved]="r.status === 'resolved'"
                            [class.row-dismissed]="r.status === 'dismissed'">
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar">{{ r.reporterId?.fullName?.charAt(0) || '?' }}</div>
                                    <div>
                                        <div class="user-name">{{ r.reporterId?.fullName || '—' }}</div>
                                        <div class="user-email">{{ r.reporterId?.email }}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar">{{ r.reportedProfileId?.fullName?.charAt(0) || '?' }}</div>
                                    <div>
                                        <div class="user-name">{{ r.reportedProfileId?.fullName || '—' }}</div>
                                        <div class="user-email">ID: {{ r.reportedProfileId?.profileId || '—' }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="reason-cell">{{ r.reason || '—' }}</td>
                            <td class="date-cell">{{ r.createdAt | date:'medium' }}</td>
                            <td>
                                <span class="status-badge" [class.pending]="!r.status || r.status === 'pending'"
                                    [class.resolved]="r.status === 'resolved'" [class.dismissed]="r.status === 'dismissed'">
                                    {{ r.status || 'pending' }}
                                </span>
                            </td>
                            <td>
                                @if (!r.status || r.status === 'pending') {
                                <div class="action-row">
                                    <button class="btn-action green" (click)="resolve(r)" title="Resolve (warn user)">✓ Resolve</button>
                                    <button class="btn-action warn" (click)="dismiss(r)" title="Dismiss">✕ Dismiss</button>
                                    <button class="btn-action red" (click)="suspendReported(r)" title="Suspend reported user">🔒</button>
                                </div>
                                }
                            </td>
                        </tr>
                    } @empty {
                        <tr><td colspan="6" class="empty-row">No reports found.</td></tr>
                    }
                </tbody>
            </table>
            <div class="pagination">
                <button class="btn-page" [disabled]="page() <= 1" (click)="prevPage()">← Prev</button>
                <span class="page-info">Page {{ page() }} of {{ pages() }}</span>
                <button class="btn-page" [disabled]="page() >= pages()" (click)="nextPage()">Next →</button>
                <span class="total-info">{{ total() }} total</span>
            </div>
        }
    </div>

    @if (toast()) {
        <div class="toast">{{ toast() }}</div>
    }
</div>`,
    styles: [`
.reports-page { display:flex; flex-direction:column; gap:1.25rem; }
.filters { display:flex; gap:0.75rem; }
.select-filter { padding:0.6rem 0.9rem; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#f1f5f9; font-size:0.9rem; outline:none; }
.select-filter:focus { border-color:#6366f1; }
.table-card { background:#1e293b; border-radius:12px; border:1px solid #334155; overflow:hidden; }
.loading,.empty-row { color:#94a3b8; text-align:center; padding:3rem; }
.admin-table { width:100%; border-collapse:collapse; }
thead tr { background:#0f172a; }
th { color:#64748b; font-size:0.75rem; text-transform:uppercase; letter-spacing:.5px; padding:0.75rem 1rem; text-align:left; }
td { padding:0.85rem 1rem; border-top:1px solid #334155; color:#f1f5f9; font-size:0.9rem; vertical-align:middle; }
.row-pending { border-left:4px solid #ef4444; }
.row-resolved { border-left:4px solid #10b981; opacity:0.8; }
.row-dismissed { border-left:4px solid #64748b; opacity:0.7; }
.user-cell { display:flex; align-items:center; gap:0.75rem; }
.user-avatar { width:36px; height:36px; border-radius:50%; background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem; flex-shrink:0; }
.user-name { font-weight:600; color:#f1f5f9; font-size:0.9rem; }
.user-email { color:#64748b; font-size:0.8rem; }
.reason-cell { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.date-cell { color:#64748b; font-size:0.8rem; }
.status-badge { padding:0.2rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:600; }
.status-badge.pending { background:#450a0a; color:#f87171; }
.status-badge.resolved { background:#052e16; color:#4ade80; }
.status-badge.dismissed { background:#1e293b; color:#94a3b8; }
.action-row { display:flex; gap:0.5rem; flex-wrap:wrap; }
.btn-action { padding:0.4rem 0.75rem; border-radius:6px; border:none; cursor:pointer; font-size:0.8rem; font-weight:600; transition:all 0.2s; }
.btn-action.green { background:#064e3b; color:#4ade80; }
.btn-action.warn { background:#451a03; color:#fb923c; }
.btn-action.red { background:#450a0a; color:#f87171; }
.btn-action:hover { transform:translateY(-1px); }
.pagination { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border-top:1px solid #334155; }
.btn-page { padding:0.4rem 0.9rem; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#94a3b8; font-size:0.85rem; cursor:pointer; }
.btn-page:disabled { opacity:0.4; cursor:not-allowed; }
.page-info { color:#94a3b8; font-size:0.85rem; }
.total-info { color:#64748b; font-size:0.8rem; margin-left:auto; }
.toast { position:fixed; bottom:2rem; right:2rem; background:#1e293b; border:1px solid #10b981; color:#10b981; padding:0.75rem 1.25rem; border-radius:10px; font-size:0.9rem; font-weight:600; z-index:200; }
    `]
})
export class ReportsComponent implements OnInit {
    reports = signal<any[]>([]);
    loading = signal(true);
    page = signal(1);
    pages = signal(1);
    total = signal(0);
    filterStatus = '';
    toast = signal('');

    constructor(private api: AdminApiService) {}

    ngOnInit() { this.load(); }

    async load() {
        this.loading.set(true);
        try {
            const params: any = { page: this.page(), limit: 20 };
            if (this.filterStatus) params.status = this.filterStatus;
            const res = await this.api.getReports(params);
            this.reports.set(res.reports);
            this.total.set(res.total);
            this.pages.set(res.pages);
        } catch { }
        this.loading.set(false);
    }

    prevPage() { this.page.update(p => Math.max(1, p - 1)); this.load(); }
    nextPage() { this.page.update(p => p + 1); this.load(); }

    async resolve(r: any) {
        await this.api.resolveReport(r._id);
        r.status = 'resolved';
        this.showToast('Report resolved. User notified.');
    }

    async dismiss(r: any) {
        await this.api.dismissReport(r._id);
        r.status = 'dismissed';
        this.showToast('Report dismissed.');
    }

    async suspendReported(r: any) {
        const profile = r.reportedProfileId;
        const userId = profile?.userId?._id ?? profile?.userId;
        if (!userId) { this.showToast('Could not find user.'); return; }
        await this.api.suspendUser(String(userId));
        await this.resolve(r);
        this.showToast('User suspended and report resolved.');
    }

    showToast(msg: string) {
        this.toast.set(msg);
        setTimeout(() => this.toast.set(''), 3000);
    }
}
