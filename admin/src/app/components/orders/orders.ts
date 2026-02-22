import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api';

@Component({
    selector: 'app-orders',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="orders-page">
    <!-- Revenue Summary -->
    <div class="revenue-cards">
        <div class="rev-card">
            <div class="rev-label">Total Revenue</div>
            <div class="rev-value">₹{{ revenueTotal() | number }}</div>
        </div>
        <div class="rev-card accent">
            <div class="rev-label">This Month</div>
            <div class="rev-value">₹{{ revenueThisMonth() | number }}</div>
        </div>
    </div>

    <!-- Filters -->
    <div class="filters">
        <select [(ngModel)]="filterStatus" (ngModelChange)="load()" class="select-filter">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
        </select>
        <select [(ngModel)]="filterPlan" (ngModelChange)="load()" class="select-filter">
            <option value="">All Plans</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="diamond">Diamond</option>
            <option value="crown">Crown</option>
        </select>
        <button class="btn-export" (click)="exportCsv()">📥 Export CSV</button>
    </div>

    <!-- Table -->
    <div class="table-card">
        @if (loading()) {
            <div class="loading">Loading orders...</div>
        } @else {
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @for (o of orders(); track o._id) {
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar">{{ o.userId?.fullName?.charAt(0) || '?' }}</div>
                                    <div>
                                        <div class="user-name">{{ o.userId?.fullName || '—' }}</div>
                                        <div class="user-email">{{ o.userId?.email }}</div>
                                    </div>
                                </div>
                            </td>
                            <td><span class="plan-badge">{{ o.plan }}</span></td>
                            <td class="amount-cell">₹{{ o.amount | number }}</td>
                            <td>
                                <span class="status-badge" [class.completed]="o.status === 'completed'"
                                    [class.pending]="o.status === 'pending'" [class.failed]="o.status === 'failed'">
                                    {{ o.status }}
                                </span>
                            </td>
                            <td class="date-cell">{{ o.createdAt | date:'medium' }}</td>
                            <td>
                                @if (o.userId) {
                                    <button class="btn-action green" (click)="grantTier(o)" title="Grant tier manually">↑ Grant</button>
                                }
                            </td>
                        </tr>
                    } @empty {
                        <tr><td colspan="6" class="empty-row">No orders found.</td></tr>
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
.orders-page { display:flex; flex-direction:column; gap:1.5rem; }
.revenue-cards { display:flex; gap:1rem; flex-wrap:wrap; }
.rev-card { background:#1e293b; border-radius:12px; padding:1.5rem; min-width:180px; border:1px solid #334155; }
.rev-card.accent { border-left:4px solid #10b981; }
.rev-label { color:#64748b; font-size:0.75rem; text-transform:uppercase; letter-spacing:.5px; }
.rev-value { color:#f1f5f9; font-size:1.5rem; font-weight:800; margin-top:0.25rem; }
.filters { display:flex; gap:0.75rem; }
.select-filter { padding:0.6rem 0.9rem; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#f1f5f9; font-size:0.9rem; outline:none; }
.btn-export { padding:0.6rem 1rem; border-radius:8px; border:1px solid #10b981; background:transparent; color:#10b981; font-size:0.9rem; font-weight:600; cursor:pointer; }
.btn-export:hover { background:#10b981; color:#fff; }
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
.plan-badge { padding:0.25rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:700; text-transform:uppercase; background:#334155; }
.amount-cell { font-weight:700; color:#10b981; }
.date-cell { color:#64748b; font-size:0.8rem; }
.status-badge { padding:0.2rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:600; }
.status-badge.completed { background:#052e16; color:#4ade80; }
.status-badge.pending { background:#451a03; color:#fb923c; }
.status-badge.failed { background:#450a0a; color:#f87171; }
.btn-action { padding:0.4rem 0.75rem; border-radius:6px; border:none; cursor:pointer; font-size:0.8rem; font-weight:600; background:#064e3b; color:#4ade80; }
.btn-action:hover { transform:translateY(-1px); }
.pagination { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border-top:1px solid #334155; }
.btn-page { padding:0.4rem 0.9rem; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#94a3b8; font-size:0.85rem; cursor:pointer; }
.btn-page:disabled { opacity:0.4; cursor:not-allowed; }
.page-info { color:#94a3b8; font-size:0.85rem; }
.total-info { color:#64748b; font-size:0.8rem; margin-left:auto; }
.toast { position:fixed; bottom:2rem; right:2rem; background:#1e293b; border:1px solid #10b981; color:#10b981; padding:0.75rem 1.25rem; border-radius:10px; font-size:0.9rem; font-weight:600; z-index:200; }
    `]
})
export class OrdersComponent implements OnInit {
    orders = signal<any[]>([]);
    loading = signal(true);
    page = signal(1);
    pages = signal(1);
    total = signal(0);
    revenueTotal = signal(0);
    revenueThisMonth = signal(0);
    filterStatus = '';
    filterPlan = '';
    toast = signal('');

    constructor(private api: AdminApiService) {}

    ngOnInit() { this.load(); }

    async load() {
        this.loading.set(true);
        try {
            const params: any = { page: this.page(), limit: 20 };
            if (this.filterStatus) params.status = this.filterStatus;
            if (this.filterPlan) params.plan = this.filterPlan;
            const res = await this.api.getOrders(params);
            this.orders.set(res.orders);
            this.total.set(res.total);
            this.pages.set(Math.max(1, res.pages || 1));
            this.revenueTotal.set(res.revenueTotal ?? 0);
            this.revenueThisMonth.set(res.revenueThisMonth ?? 0);
        } catch { }
        this.loading.set(false);
    }

    prevPage() { this.page.update(p => Math.max(1, p - 1)); this.load(); }
    nextPage() { this.page.update(p => p + 1); this.load(); }

    async exportCsv() {
        try {
            const params: any = {};
            if (this.filterStatus) params.status = this.filterStatus;
            if (this.filterPlan) params.plan = this.filterPlan;
            const blob = await this.api.exportOrders(params);
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'orders.csv';
            a.click();
            URL.revokeObjectURL(a.href);
            this.showToast('Export downloaded.');
        } catch {
            this.showToast('Export failed.');
        }
    }

    async grantTier(order: any) {
        const userId = order.userId?._id ?? order.userId;
        if (!userId) return;
        const tier = order.plan || 'gold';
        try {
            await this.api.setMembership(String(userId), tier);
            this.showToast(`Tier ${tier} granted to user.`);
        } catch {
            this.showToast('Failed to grant tier.');
        }
    }

    showToast(msg: string) {
        this.toast.set(msg);
        setTimeout(() => this.toast.set(''), 3000);
    }
}
