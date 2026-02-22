import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../services/admin-api';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
<div class="settings-page">
    <h2 class="page-title">Platform Settings</h2>

    @if (loading()) {
        <div class="loading">Loading settings...</div>
    } @else {
    <div class="settings-card">
        <h3 class="card-title">General</h3>
        <div class="setting-row">
            <label class="toggle-label">Maintenance mode</label>
            <label class="toggle">
                <input type="checkbox" [(ngModel)]="maintenanceMode" (ngModelChange)="saveSettings()" />
                <span class="slider"></span>
            </label>
        </div>
        <p class="setting-hint">When enabled, users see a maintenance banner on the main app.</p>
    </div>

    <div class="settings-card">
        <h3 class="card-title">Limits</h3>
        <div class="setting-row">
            <label class="input-label">Max photos per user</label>
            <input type="number" [(ngModel)]="maxPhotos" min="1" max="50" class="input-field" (ngModelChange)="saveSettings()" />
        </div>
        <p class="setting-hint">Maximum number of photos a user can upload.</p>
    </div>

    <div class="settings-card">
        <h3 class="card-title">Tier pricing</h3>
        <table class="tier-table">
            <thead>
                <tr>
                    <th>Tier</th>
                    <th>Amount (₹)</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody>
                @for (t of tiers; track t.tier) {
                    <tr>
                        <td><span class="tier-badge">{{ t.tier }}</span></td>
                        <td><input type="number" [(ngModel)]="t.amount" (ngModelChange)="saveSettings()" class="input-field small" /></td>
                        <td><input type="text" [(ngModel)]="t.duration" (ngModelChange)="saveSettings()" class="input-field" /></td>
                    </tr>
                }
            </tbody>
        </table>
        <p class="setting-hint">Use Orders page to manually grant tiers.</p>
    </div>

    <div class="settings-card">
        <h3 class="card-title">Feature profiles</h3>
        <p class="setting-desc">Manage which profiles appear in the homepage diamond section.</p>
        <a routerLink="/profiles" class="btn-link">Go to Profiles →</a>
        <p class="setting-hint">Use the "Feature" action on individual profiles to feature them.</p>
    </div>
    }

    @if (toast()) {
        <div class="toast">{{ toast() }}</div>
    }
</div>`,
    styles: [`
.settings-page { display:flex; flex-direction:column; gap:1.5rem; }
.page-title { color:#f1f5f9; font-size:1.5rem; font-weight:700; margin:0; }
.loading { color:#94a3b8; padding:2rem; }
.settings-card { background:#1e293b; border-radius:12px; padding:1.5rem; border:1px solid #334155; }
.card-title { color:#f1f5f9; font-size:1rem; font-weight:600; margin:0 0 1rem 0; }
.setting-row { display:flex; align-items:center; gap:1rem; margin-bottom:0.5rem; }
.toggle-label, .input-label { color:#94a3b8; font-size:0.9rem; min-width:160px; }
.toggle { position:relative; display:inline-block; width:48px; height:26px; }
.toggle input { opacity:0; width:0; height:0; }
.slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:#334155; border-radius:26px; transition:.3s; }
.slider::before { position:absolute; content:""; height:20px; width:20px; left:3px; bottom:3px; background:#f1f5f9; border-radius:50%; transition:.3s; }
.toggle input:checked + .slider { background:#10b981; }
.toggle input:checked + .slider::before { transform:translateX(22px); }
.input-field { padding:0.5rem 0.75rem; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#f1f5f9; font-size:0.9rem; width:120px; }
.input-field.small { width:80px; }
.setting-hint, .setting-desc { color:#64748b; font-size:0.8rem; margin:0.5rem 0 0 0; }
.tier-table { width:100%; border-collapse:collapse; margin-top:0.5rem; }
.tier-table th { color:#64748b; font-size:0.75rem; text-transform:uppercase; letter-spacing:.5px; padding:0.6rem 0; text-align:left; }
.tier-table td { padding:0.6rem 0; border-top:1px solid #334155; color:#f1f5f9; font-size:0.9rem; }
.tier-badge { padding:0.25rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:700; text-transform:uppercase; background:#334155; }
.btn-link { display:inline-block; margin-top:0.75rem; color:#10b981; font-size:0.9rem; font-weight:600; text-decoration:none; }
.btn-link:hover { text-decoration:underline; }
.toast { position:fixed; bottom:2rem; right:2rem; background:#1e293b; border:1px solid #10b981; color:#10b981; padding:0.75rem 1.25rem; border-radius:10px; font-size:0.9rem; font-weight:600; z-index:200; }
    `]
})
export class SettingsComponent implements OnInit {
    maintenanceMode = false;
    maxPhotos = 10;
    tiers: { tier: string; amount: number; duration: string }[] = [
        { tier: 'silver', amount: 0, duration: '1 month' },
        { tier: 'gold', amount: 0, duration: '1 month' },
        { tier: 'diamond', amount: 0, duration: '1 month' },
        { tier: 'crown', amount: 0, duration: '1 month' }
    ];
    loading = signal(true);
    toast = signal('');
    private saveTimeout: any;

    constructor(private api: AdminApiService) {}

    ngOnInit() { this.load(); }

    async load() {
        this.loading.set(true);
        try {
            const s = await this.api.getPlatformSettings();
            this.maintenanceMode = s.maintenanceMode ?? false;
            this.maxPhotos = s.maxPhotosPerUser ?? 10;
            if (Array.isArray(s.tierPricing) && s.tierPricing.length) {
                this.tiers = s.tierPricing.map((t: any) => ({ tier: t.tier, amount: t.amount ?? 0, duration: t.duration ?? '1 month' }));
            }
            if (this.tiers.length < 4) {
                const existing = this.tiers.map(t => t.tier);
                ['silver', 'gold', 'diamond', 'crown'].forEach(t => {
                    if (!existing.includes(t)) this.tiers.push({ tier: t, amount: 0, duration: '1 month' });
                });
            }
        } catch { }
        this.loading.set(false);
    }

    saveSettings() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.doSave(), 500);
    }

    async doSave() {
        try {
            await this.api.putPlatformSettings({
                maintenanceMode: this.maintenanceMode,
                maxPhotosPerUser: this.maxPhotos,
                tierPricing: this.tiers
            });
            this.showToast('Settings saved.');
        } catch {
            this.showToast('Failed to save settings.');
        }
    }

    showToast(msg: string) {
        this.toast.set(msg);
        setTimeout(() => this.toast.set(''), 3000);
    }
}
