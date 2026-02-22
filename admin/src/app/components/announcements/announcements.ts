import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api';

@Component({
    selector: 'app-announcements',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="announcements-page">
    <div class="page-header">
        <h2 class="page-title">Announcements</h2>
        <button class="btn-create" (click)="openCreate()">+ New</button>
    </div>

    <div class="table-card">
        @if (loading()) {
            <div class="loading">Loading...</div>
        } @else {
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Active</th>
                        <th>Dates</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @for (a of announcements(); track a._id) {
                        <tr>
                            <td><strong>{{ a.title }}</strong></td>
                            <td><span class="type-badge" [class]="a.type">{{ a.type }}</span></td>
                            <td>
                                <label class="toggle">
                                    <input type="checkbox" [checked]="a.active" (change)="toggleActive(a)" />
                                    <span class="slider"></span>
                                </label>
                            </td>
                            <td class="date-cell">{{ formatDates(a) }}</td>
                            <td>
                                <button class="btn-action" (click)="edit(a)">Edit</button>
                                <button class="btn-action red" (click)="remove(a)">Delete</button>
                            </td>
                        </tr>
                    } @empty {
                        <tr><td colspan="5" class="empty-row">No announcements. Create one to show banners on the user app.</td></tr>
                    }
                </tbody>
            </table>
        }
    </div>

    @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
            <div class="modal" (click)="$event.stopPropagation()">
                <h3>{{ editingId() ? 'Edit' : 'New' }} Announcement</h3>
                <div class="form-group">
                    <label>Title</label>
                    <input [(ngModel)]="form.title" class="input" placeholder="Announcement title" />
                </div>
                <div class="form-group">
                    <label>Message</label>
                    <textarea [(ngModel)]="form.message" class="input" rows="3" placeholder="Message to display"></textarea>
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select [(ngModel)]="form.type" class="input">
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="datetime-local" [(ngModel)]="form.startDate" class="input" />
                    </div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="datetime-local" [(ngModel)]="form.endDate" class="input" />
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-cancel" (click)="closeModal()">Cancel</button>
                    <button class="btn-save" (click)="save()">Save</button>
                </div>
            </div>
        </div>
    }

    @if (toast()) {
        <div class="toast">{{ toast() }}</div>
    }
</div>`,
    styles: [`
.announcements-page { display:flex; flex-direction:column; gap:1.5rem; }
.page-header { display:flex; justify-content:space-between; align-items:center; }
.page-title { color:#f1f5f9; font-size:1.5rem; font-weight:700; margin:0; }
.btn-create { padding:0.5rem 1rem; border-radius:8px; border:none; background:#10b981; color:#fff; font-weight:600; cursor:pointer; }
.btn-create:hover { background:#059669; }
.table-card { background:#1e293b; border-radius:12px; border:1px solid #334155; overflow:hidden; }
.loading,.empty-row { color:#94a3b8; text-align:center; padding:3rem; }
.admin-table { width:100%; border-collapse:collapse; }
thead tr { background:#0f172a; }
th { color:#64748b; font-size:0.75rem; text-transform:uppercase; letter-spacing:.5px; padding:0.75rem 1rem; text-align:left; }
td { padding:0.85rem 1rem; border-top:1px solid #334155; color:#f1f5f9; font-size:0.9rem; }
.type-badge { padding:0.2rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:600; }
.type-badge.info { background:#1e3a5f; color:#93c5fd; }
.type-badge.warning { background:#451a03; color:#fb923c; }
.type-badge.maintenance { background:#422006; color:#fcd34d; }
.toggle { position:relative; display:inline-block; width:40px; height:22px; }
.toggle input { opacity:0; width:0; height:0; }
.slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:#334155; border-radius:22px; transition:.3s; }
.slider::before { position:absolute; content:""; height:16px; width:16px; left:3px; bottom:3px; background:#f1f5f9; border-radius:50%; transition:.3s; }
.toggle input:checked + .slider { background:#10b981; }
.toggle input:checked + .slider::before { transform:translateX(18px); }
.date-cell { color:#64748b; font-size:0.8rem; }
.btn-action { padding:0.35rem 0.65rem; border-radius:6px; border:none; background:#334155; color:#94a3b8; font-size:0.8rem; cursor:pointer; margin-right:0.5rem; }
.btn-action.red { background:#450a0a; color:#f87171; }
.modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:100; }
.modal { background:#1e293b; border-radius:12px; padding:1.5rem; min-width:400px; border:1px solid #334155; }
.modal h3 { color:#f1f5f9; margin:0 0 1rem 0; }
.form-group { margin-bottom:1rem; }
.form-group label { display:block; color:#94a3b8; font-size:0.85rem; margin-bottom:0.35rem; }
.input { width:100%; padding:0.5rem 0.75rem; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#f1f5f9; font-size:0.9rem; }
.form-row { display:flex; gap:1rem; }
.form-row .form-group { flex:1; }
.modal-actions { display:flex; gap:0.75rem; justify-content:flex-end; margin-top:1.5rem; }
.btn-cancel { padding:0.5rem 1rem; border-radius:8px; border:1px solid #334155; background:transparent; color:#94a3b8; cursor:pointer; }
.btn-save { padding:0.5rem 1rem; border-radius:8px; border:none; background:#10b981; color:#fff; font-weight:600; cursor:pointer; }
.toast { position:fixed; bottom:2rem; right:2rem; background:#1e293b; border:1px solid #10b981; color:#10b981; padding:0.75rem 1.25rem; border-radius:10px; font-size:0.9rem; font-weight:600; z-index:200; }
    `]
})
export class AnnouncementsComponent implements OnInit {
    announcements = signal<any[]>([]);
    loading = signal(true);
    showModal = signal(false);
    editingId = signal('');
    toast = signal('');
    form = { title: '', message: '', type: 'info', startDate: '', endDate: '' };

    constructor(private api: AdminApiService) {}

    ngOnInit() { this.load(); }

    async load() {
        this.loading.set(true);
        try {
            const list = await this.api.getAnnouncements();
            this.announcements.set(list);
        } catch { }
        this.loading.set(false);
    }

    openCreate() {
        this.form = { title: '', message: '', type: 'info', startDate: '', endDate: '' };
        this.editingId.set('');
        this.showModal.set(true);
    }

    edit(a: any) {
        this.form = {
            title: a.title,
            message: a.message,
            type: a.type || 'info',
            startDate: a.startDate ? new Date(a.startDate).toISOString().slice(0, 16) : '',
            endDate: a.endDate ? new Date(a.endDate).toISOString().slice(0, 16) : ''
        };
        this.editingId.set(a._id);
        this.showModal.set(true);
    }

    closeModal() { this.showModal.set(false); }

    async save() {
        if (!this.form.title || !this.form.message) {
            this.showToast('Title and message required.');
            return;
        }
        try {
            const payload = {
                title: this.form.title,
                message: this.form.message,
                type: this.form.type,
                startDate: this.form.startDate || undefined,
                endDate: this.form.endDate || undefined
            };
            const id = this.editingId();
            if (id) {
                await this.api.updateAnnouncement(id, payload);
                this.showToast('Updated.');
            } else {
                await this.api.createAnnouncement(payload);
                this.showToast('Created.');
            }
            this.closeModal();
            this.load();
        } catch {
            this.showToast('Failed to save.');
        }
    }

    async toggleActive(a: any) {
        try {
            await this.api.updateAnnouncement(a._id, { active: !a.active });
            this.load();
        } catch { }
    }

    async remove(a: any) {
        if (!confirm('Delete this announcement?')) return;
        try {
            await this.api.deleteAnnouncement(a._id);
            this.showToast('Deleted.');
            this.load();
        } catch {
            this.showToast('Failed to delete.');
        }
    }

    formatDates(a: any): string {
        const start = a.startDate ? new Date(a.startDate).toLocaleDateString() : '';
        const end = a.endDate ? new Date(a.endDate).toLocaleDateString() : '';
        if (start && end) return start + ' – ' + end;
        if (start) return 'From ' + start;
        if (end) return 'Until ' + end;
        return '—';
    }

    showToast(msg: string) {
        this.toast.set(msg);
        setTimeout(() => this.toast.set(''), 3000);
    }
}
