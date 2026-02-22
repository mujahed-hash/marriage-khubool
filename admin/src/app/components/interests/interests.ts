import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api';

@Component({
    selector: 'app-interests',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="interests-page">
    <div class="filters">
        <select [(ngModel)]="filterStatus" (ngModelChange)="load()" class="select-filter">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
        </select>
        <input type="date" [(ngModel)]="filterFromDate" (ngModelChange)="load()" class="date-filter" placeholder="From date" />
        <input type="date" [(ngModel)]="filterToDate" (ngModelChange)="load()" class="date-filter" placeholder="To date" />
    </div>

    <div class="table-card">
        @if (loading()) {
            <div class="loading">Loading interests...</div>
        } @else {
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    @for (i of interests(); track i._id) {
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar">{{ i.fromUserId?.fullName?.charAt(0) || '?' }}</div>
                                    <div>
                                        <div class="user-name">{{ i.fromUserId?.fullName || '—' }}</div>
                                        <div class="user-email">{{ i.fromUserId?.email }}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar">{{ i.toProfileId?.fullName?.charAt(0) || '?' }}</div>
                                    <div>
                                        <div class="user-name">{{ i.toProfileId?.fullName || '—' }}</div>
                                        <div class="user-email">ID: {{ i.toProfileId?.profileId || '—' }}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge" [class.pending]="i.status === 'pending'"
                                    [class.accepted]="i.status === 'accepted'" [class.rejected]="i.status === 'rejected'">
                                    {{ i.status }}
                                </span>
                            </td>
                            <td class="date-cell">{{ i.createdAt | date:'medium' }}</td>
                        </tr>
                    } @empty {
                        <tr><td colspan="4" class="empty-row">No interests found.</td></tr>
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
.interests-page { display:flex; flex-direction:column; gap:1.5rem; }
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
.date-cell { color:#64748b; font-size:0.8rem; }
.status-badge { padding:0.2rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:600; }
.status-badge.pending { background:#451a03; color:#fb923c; }
.status-badge.accepted { background:#052e16; color:#4ade80; }
.status-badge.rejected { background:#450a0a; color:#f87171; }
.pagination { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border-top:1px solid #334155; }
.btn-page { padding:0.4rem 0.9rem; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#94a3b8; font-size:0.85rem; cursor:pointer; }
.btn-page:disabled { opacity:0.4; cursor:not-allowed; }
.page-info { color:#94a3b8; font-size:0.85rem; }
.total-info { color:#64748b; font-size:0.8rem; margin-left:auto; }
    `]
})
export class InterestsComponent implements OnInit {
    interests = signal<any[]>([]);
    loading = signal(true);
    page = signal(1);
    pages = signal(1);
    total = signal(0);
    filterStatus = '';
    filterFromDate = '';
    filterToDate = '';

    constructor(private api: AdminApiService) {}

    ngOnInit() { this.load(); }

    async load() {
        this.loading.set(true);
        try {
            const params: any = { page: this.page(), limit: 30 };
            if (this.filterStatus) params.status = this.filterStatus;
            if (this.filterFromDate) params.fromDate = this.filterFromDate;
            if (this.filterToDate) params.toDate = this.filterToDate;
            const res = await this.api.getInterests(params);
            this.interests.set(res.interests);
            this.total.set(res.total);
            this.pages.set(res.pages);
        } catch { }
        this.loading.set(false);
    }

    prevPage() { this.page.update(p => Math.max(1, p - 1)); this.load(); }
    nextPage() { this.page.update(p => p + 1); this.load(); }
}
