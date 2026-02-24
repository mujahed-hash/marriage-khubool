import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api';

@Component({
    selector: 'app-audit-log',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="audit-page">
    <div class="filters">
        <select [(ngModel)]="filterAction" (ngModelChange)="load()" class="select-filter">
            <option value="">All Actions</option>
            <option value="suspend_user">Suspend User</option>
            <option value="verify_user">Verify User</option>
            <option value="set_membership">Set Membership</option>
            <option value="delete_user">Delete User</option>
            <option value="deactivate_profile">Deactivate Profile</option>
            <option value="feature_profile">Feature Profile</option>
            <option value="resolve_report">Resolve Report</option>
            <option value="dismiss_report">Dismiss Report</option>
            <option value="update_settings">Update Settings</option>
            <option value="create_announcement">Create Announcement</option>
            <option value="update_announcement">Update Announcement</option>
            <option value="delete_announcement">Delete Announcement</option>
            <option value="view_conversation">View Conversation</option>
            <option value="impersonate_user">Impersonate User</option>
        </select>
        <input type="date" [(ngModel)]="filterFromDate" (ngModelChange)="load()" class="date-filter" />
        <input type="date" [(ngModel)]="filterToDate" (ngModelChange)="load()" class="date-filter" />
    </div>

    <div class="table-card">
        @if (loading()) {
            <div class="loading">Loading audit log...</div>
        } @else {
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Admin</th>
                        <th>Action</th>
                        <th>Resource</th>
                        <th>Details</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    @for (log of logs(); track log._id) {
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar">{{ log.adminId?.fullName?.charAt(0) || '?' }}</div>
                                    <div>
                                        <div class="user-name">{{ log.adminId?.fullName || '—' }}</div>
                                        <div class="user-email">{{ log.adminId?.email }}</div>
                                    </div>
                                </div>
                            </td>
                            <td><span class="action-badge">{{ log.action }}</span></td>
                            <td>{{ log.resource }}</td>
                            <td class="details-cell">{{ formatDetails(log.details) }}</td>
                            <td class="date-cell">{{ log.createdAt | date:'medium' }}</td>
                        </tr>
                    } @empty {
                        <tr><td colspan="5" class="empty-row">No audit entries found.</td></tr>
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
</div>`,
    styles: [`
.audit-page { display:flex; flex-direction:column; gap:1.5rem; }
.filters { display:flex; gap:0.75rem; flex-wrap:wrap; }
.select-filter, .date-filter { padding:0.6rem 0.9rem; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#f1f5f9; font-size:0.9rem; outline:none; }
.table-card { background:#1e293b; border-radius:12px; border:1px solid #334155; overflow:hidden; }
.loading,.empty-row { color:#94a3b8; text-align:center; padding:3rem; }
.admin-table { width:100%; border-collapse:collapse; }
thead tr { background:#0f172a; }
th { color:#64748b; font-size:0.75rem; text-transform:uppercase; letter-spacing:.5px; padding:0.75rem 1rem; text-align:left; }
td { padding:0.85rem 1rem; border-top:1px solid #334155; color:#f1f5f9; font-size:0.9rem; vertical-align:middle; }
.user-cell { display:flex; align-items:center; gap:0.75rem; }
.user-avatar { width:36px; height:36px; border-radius:50%; background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem; flex-shrink:0; }
.user-name { font-weight:600; color:#f1f5f9; }
.user-email { color:#64748b; font-size:0.8rem; }
.action-badge { padding:0.25rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:600; background:#334155; }
.details-cell { color:#94a3b8; font-size:0.85rem; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.date-cell { color:#64748b; font-size:0.8rem; }
.pagination { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border-top:1px solid #334155; }
.btn-page { padding:0.4rem 0.9rem; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#94a3b8; font-size:0.85rem; cursor:pointer; }
.btn-page:disabled { opacity:0.4; cursor:not-allowed; }
.page-info { color:#94a3b8; font-size:0.85rem; }
.total-info { color:#64748b; font-size:0.8rem; margin-left:auto; }
    `]
})
export class AuditLogComponent implements OnInit {
    logs = signal<any[]>([]);
    loading = signal(true);
    page = signal(1);
    pages = signal(1);
    total = signal(0);
    filterAction = '';
    filterFromDate = '';
    filterToDate = '';

    constructor(private api: AdminApiService) { }

    ngOnInit() { this.load(); }

    async load() {
        this.loading.set(true);
        try {
            const params: any = { page: this.page(), limit: 50 };
            if (this.filterAction) params.action = this.filterAction;
            if (this.filterFromDate) params.fromDate = this.filterFromDate;
            if (this.filterToDate) params.toDate = this.filterToDate;
            const res = await this.api.getAuditLog(params);
            this.logs.set(res.logs);
            this.total.set(res.total);
            this.pages.set(Math.max(1, res.pages || 1));
        } catch { }
        this.loading.set(false);
    }

    prevPage() { this.page.update(p => Math.max(1, p - 1)); this.load(); }
    nextPage() { this.page.update(p => p + 1); this.load(); }

    formatDetails(d: any): string {
        if (!d) return '—';
        const parts: string[] = [];
        if (d.email) parts.push(d.email);
        if (d.tier) parts.push('tier: ' + d.tier);
        if (d.isSuspended !== undefined) parts.push('suspended: ' + d.isSuspended);
        if (d.isActive !== undefined) parts.push('active: ' + d.isActive);
        if (d.featured !== undefined) parts.push('featured: ' + d.featured);
        if (d.fullName) parts.push(d.fullName);
        if (d.reason) parts.push('reason: ' + d.reason);
        if (d.title) parts.push(d.title);
        if (d.maintenanceMode !== undefined) parts.push('maintenance: ' + d.maintenanceMode);
        if (d.maxPhotosPerUser !== undefined) parts.push('maxPhotos: ' + d.maxPhotosPerUser);
        if (d.participants) parts.push('with: ' + d.participants);
        return parts.length ? parts.join(', ') : JSON.stringify(d);
    }
}
