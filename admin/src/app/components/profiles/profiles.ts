import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-profiles',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="profiles-page">
    <!-- Filters -->
    <div class="filters">
        <input type="text" [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Search name, ID or Profile ID..." class="input-filter">
        <select [(ngModel)]="filterGender" (ngModelChange)="load()" class="select-filter">
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
        </select>
        <select [(ngModel)]="filterTier" (ngModelChange)="load()" class="select-filter">
            <option value="">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="diamond">Diamond</option>
            <option value="crown">Crown</option>
        </select>
        <select [(ngModel)]="filterActive" (ngModelChange)="load()" class="select-filter">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
        </select>
        <button class="btn-export" (click)="exportCSV()">Export CSV</button>
    </div>

    <!-- Table -->
    <div class="table-card">
        @if (loading()) {
            <div class="loading">Loading profiles...</div>
        } @else {
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Profile</th>
                        <th>Info</th>
                        <th>Tier</th>
                        <th>Status</th>
                        <th>Featured</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @for (p of profiles(); track p._id) {
                        <tr [class.inactive-row]="p.isActive === false">
                            <td>
                                <div class="profile-cell">
                                    @if (p.profilePhotoUrl) {
                                        <img [src]="photoUrl(p.profilePhotoUrl)" class="profile-photo" alt="photo" (error)="onImgError($event)">
                                    } @else {
                                        <div class="profile-avatar" [class.female]="p.gender === 'female'">{{ p.fullName?.charAt(0) || '?' }}</div>
                                    }
                                    <div>
                                        <div class="profile-name">{{ p.fullName || '—' }}</div>
                                        <div class="profile-id">{{ p.profileId || p._id?.slice(-8) }}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="info-cell">
                                    <span>{{ p.gender || '—' }}</span>
                                    <span>{{ p.state || '—' }}</span>
                                    @if (p.occupation) { <span>{{ p.occupation }}</span> }
                                </div>
                            </td>
                            <td>
                                <span class="tier-badge tier-{{ p.userId?.membershipTier || 'bronze' }}">
                                    {{ p.userId?.membershipTier || 'bronze' }}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge" [class.active]="p.isActive !== false" [class.inactive]="p.isActive === false">
                                    {{ p.isActive === false ? 'Inactive' : 'Active' }}
                                </span>
                            </td>
                            <td>
                                <span class="featured-badge" [class.yes]="p.featured">{{ p.featured ? '⭐ Featured' : '—' }}</span>
                            </td>
                            <td class="date-cell">{{ p.createdAt | date:'mediumDate' }}</td>
                            <td>
                                <div class="action-row">
                                    <button class="btn-action blue" (click)="viewFullProfile(p)" title="View Full Profile">👁️</button>
                                    <button class="btn-action" [class.warn]="p.isActive !== false" [class.green]="p.isActive === false" (click)="toggleActive(p)" [title]="p.isActive === false ? 'Activate' : 'Deactivate'">
                                        {{ p.isActive === false ? '▶' : '⏸' }}
                                    </button>
                                    <button class="btn-action" [class.yellow]="!p.featured" [class.green]="p.featured" (click)="toggleFeature(p)" [title]="p.featured ? 'Unfeature' : 'Feature'">
                                        ⭐
                                    </button>
                                </div>
                            </td>
                        </tr>
                    } @empty {
                        <tr><td colspan="7" class="empty-row">No profiles found.</td></tr>
                    }
                </tbody>
            </table>
            <div class="pagination">
                <button class="btn-page" [disabled]="page() <= 1" (click)="prevPage()">← Prev</button>
                <span class="page-info">Page {{ page() }} of {{ pages() }}</span>
                <button class="btn-page" [disabled]="page() >= pages()" (click)="nextPage()">Next →</button>
                <span class="total-info">{{ total() }} total profiles</span>
            </div>
        }
    </div>

    <!-- Full Profile Modal -->
    @if (selectedProfile()) {
        <div class="modal-overlay" (click)="selectedProfile.set(null)">
            <div class="modal full-profile-modal" (click)="$event.stopPropagation()">
                <div class="modal-header">
                    <h3>Full Profile: {{ selectedProfile()?.fullName }}</h3>
                    <button class="btn-close" (click)="selectedProfile.set(null)">✕</button>
                </div>
                <div class="modal-body">
                    <div class="profile-header">
                        <div class="header-photo">
                            @if (selectedProfile()?.profilePhotoUrl) {
                                <img [src]="photoUrl(selectedProfile()?.profilePhotoUrl)" class="large-photo" alt="photo">
                            } @else {
                                <div class="large-avatar" [class.female]="selectedProfile()?.gender === 'female'">{{ selectedProfile()?.fullName?.charAt(0) || '?' }}</div>
                            }
                        </div>
                        <div class="header-info">
                            <h2>{{ selectedProfile()?.fullName }}</h2>
                            <p class="profile-id-tag">{{ selectedProfile()?.profileId }}</p>
                            <div class="header-badges">
                                <span class="tier-badge tier-{{ selectedProfile()?.userId?.membershipTier || 'bronze' }}">{{ selectedProfile()?.userId?.membershipTier || 'bronze' }}</span>
                                <span class="status-badge" [class.active]="selectedProfile()?.isActive !== false">{{ selectedProfile()?.isActive === false ? 'Inactive' : 'Active' }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-sections">
                        <!-- Basic Info -->
                        <section class="info-section">
                            <h4>Basic Details</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Gender</span><span class="value">{{ selectedProfile()?.gender }}</span></div>
                                <div class="info-item"><span class="label">Date of Birth</span><span class="value">{{ selectedProfile()?.dateOfBirth || '—' }}</span></div>
                                <div class="info-item"><span class="label">Height</span><span class="value">{{ selectedProfile()?.height || '—' }}</span></div>
                                <div class="info-item"><span class="label">Marital Status</span><span class="value">{{ selectedProfile()?.maritalStatus || '—' }}</span></div>
                                <div class="info-item"><span class="label">Mother Tongue</span><span class="value">{{ selectedProfile()?.motherTongue || '—' }}</span></div>
                            </div>
                        </section>

                        <!-- Religion & Culture -->
                        <section class="info-section">
                            <h4>Religion & Culture</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Religion</span><span class="value">{{ selectedProfile()?.religion || '—' }}</span></div>
                                <div class="info-item"><span class="label">Caste</span><span class="value">{{ selectedProfile()?.caste || '—' }}</span></div>
                                <div class="info-item"><span class="label">Gothra</span><span class="value">{{ selectedProfile()?.gothra || '—' }}</span></div>
                                <div class="info-item"><span class="label">Manglik</span><span class="value">{{ selectedProfile()?.manglik || '—' }}</span></div>
                                <div class="info-item"><span class="label">Dargah/Fateha</span><span class="value">{{ selectedProfile()?.visitDarghaFateha || '—' }}</span></div>
                            </div>
                        </section>

                        <!-- Education & Career -->
                        <section class="info-section">
                            <h4>Education & Career</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Highest Education</span><span class="value">{{ selectedProfile()?.highestEducation || '—' }}</span></div>
                                <div class="info-item"><span class="label">Degree</span><span class="value">{{ selectedProfile()?.degree || '—' }}</span></div>
                                <div class="info-item"><span class="label">Occupation</span><span class="value">{{ selectedProfile()?.occupation || '—' }}</span></div>
                                <div class="info-item"><span class="label">Company</span><span class="value">{{ selectedProfile()?.company || '—' }}</span></div>
                                <div class="info-item"><span class="label">Monthly Income</span><span class="value">{{ selectedProfile()?.monthlyIncome || '—' }}</span></div>
                                <div class="info-item"><span class="label">Place of Work</span><span class="value">{{ selectedProfile()?.placeOfOccupation || '—' }}</span></div>
                            </div>
                        </section>

                        <!-- Family Details -->
                        <section class="info-section">
                            <h4>Family Details</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Father Status</span><span class="value">{{ selectedProfile()?.fatherStatus || '—' }}</span></div>
                                <div class="info-item"><span class="label">Mother Status</span><span class="value">{{ selectedProfile()?.motherStatus || '—' }}</span></div>
                                <div class="info-item"><span class="label">Siblings</span><span class="value">{{ selectedProfile()?.siblings || '—' }}</span></div>
                                <div class="info-item"><span class="label">Family Type</span><span class="value">{{ selectedProfile()?.familyType || '—' }}</span></div>
                                <div class="info-item"><span class="label">Family Values</span><span class="value">{{ selectedProfile()?.familyValues || '—' }}</span></div>
                                <div class="info-item"><span class="label">Father Name/Occ.</span><span class="value">{{ selectedProfile()?.fatherName }} / {{ selectedProfile()?.fatherOccupation }}</span></div>
                                <div class="info-item"><span class="label">Mother Name/Occ.</span><span class="value">{{ selectedProfile()?.motherName }} / {{ selectedProfile()?.motherOccupation }}</span></div>
                            </div>
                        </section>

                        <!-- Location -->
                        <section class="info-section">
                            <h4>Location</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Country</span><span class="value">{{ selectedProfile()?.country }}</span></div>
                                <div class="info-item"><span class="label">State</span><span class="value">{{ selectedProfile()?.state }}</span></div>
                                <div class="info-item"><span class="label">District</span><span class="value">{{ selectedProfile()?.district }}</span></div>
                                <div class="info-item"><span class="label">City/Locality</span><span class="value">{{ selectedProfile()?.city }} / {{ selectedProfile()?.locality }}</span></div>
                                <div class="info-item"><span class="label">Pin Code</span><span class="value">{{ selectedProfile()?.pinCode }}</span></div>
                                <div class="info-item"><span class="label">Native Place</span><span class="value">{{ selectedProfile()?.nativePlace }}</span></div>
                            </div>
                        </section>

                        <!-- Lifestyle & Bio -->
                        <section class="info-section">
                            <h4>Lifestyle & Bio</h4>
                            <div class="info-grid bio-row">
                                <div class="info-item"><span class="label">Bio</span><span class="value bio-text">{{ selectedProfile()?.bio || 'No bio provided.' }}</span></div>
                            </div>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Diet</span><span class="value">{{ selectedProfile()?.diet || '—' }}</span></div>
                                <div class="info-item"><span class="label">Smoking</span><span class="value">{{ selectedProfile()?.smoking || '—' }}</span></div>
                                <div class="info-item"><span class="label">Drinking</span><span class="value">{{ selectedProfile()?.drinking || '—' }}</span></div>
                                <div class="info-item"><span class="label">Complexion</span><span class="value">{{ selectedProfile()?.complexion || '—' }}</span></div>
                            </div>
                            <div class="info-grid hobbies-row">
                                <div class="info-item"><span class="label">Hobbies</span><span class="value">
                                    <div class="tags">
                                        @for (h of selectedProfile()?.hobbies; track h) {
                                            <span class="tag">{{ h }}</span>
                                        } @empty { — }
                                    </div>
                                </span></div>
                            </div>
                        </section>

                        <!-- Partner Preferences -->
                        <section class="info-section partner-section">
                            <h4>Partner Preferences</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Age Range</span><span class="value">{{ selectedProfile()?.partnerPreferences?.ageRange?.min }} - {{ selectedProfile()?.partnerPreferences?.ageRange?.max }} yrs</span></div>
                                <div class="info-item"><span class="label">Education</span><span class="value">{{ selectedProfile()?.partnerPreferences?.education || '—' }}</span></div>
                                <div class="info-item"><span class="label">States</span><span class="value">
                                    <div class="tags">
                                        @for (s of selectedProfile()?.partnerPreferences?.state; track s) {
                                            <span class="tag">{{ s }}</span>
                                        } @empty { — }
                                    </div>
                                </span></div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    }

    @if (toast()) {
        <div class="toast">{{ toast() }}</div>
    }
</div>`,
    styles: [`
.profiles-page { display:flex; flex-direction:column; gap:1.25rem; }
.filters { display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center; }
.input-filter,.select-filter { padding:0.6rem 0.9rem; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#f1f5f9; font-size:0.9rem; outline:none; }
.input-filter { flex:1; min-width:200px; }
.btn-export { padding:0.6rem 1.25rem; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#94a3b8; font-size:0.9rem; font-weight:700; cursor:pointer; white-space:nowrap; transition:all 0.2s; }
.btn-export:hover { background:#1e293b; color:#fff; }
.table-card { background:#1e293b; border-radius:12px; border:1px solid #334155; overflow:hidden; }
.loading,.empty-row { color:#94a3b8; text-align:center; padding:3rem; }
.admin-table { width:100%; border-collapse:collapse; }
thead tr { background:#0f172a; }
th { color:#64748b; font-size:0.75rem; text-transform:uppercase; letter-spacing:.5px; padding:0.75rem 1rem; text-align:left; }
td { padding:0.85rem 1rem; border-top:1px solid #334155; color:#f1f5f9; font-size:0.85rem; vertical-align:middle; }
.inactive-row td { opacity:0.5; }
.profile-cell { display:flex; align-items:center; gap:0.75rem; }
.profile-photo { width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid #334155; flex-shrink:0; }
.profile-avatar { width:40px; height:40px; border-radius:50%; background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem; flex-shrink:0; }
.profile-avatar.female { background:#ec4899; }
.profile-name { font-weight:600; color:#f1f5f9; }
.profile-id { color:#64748b; font-size:0.75rem; font-family:monospace; }
.info-cell { display:flex; flex-direction:column; gap:0.15rem; color:#94a3b8; font-size:0.8rem; }
.tier-badge { padding:0.2rem 0.55rem; border-radius:12px; font-size:0.72rem; font-weight:700; text-transform:uppercase; }
.tier-bronze { background:#7c3516; color:#fb923c; }
.tier-silver { background:#1e3a5f; color:#94a3b8; }
.tier-gold { background:#713f12; color:#fbbf24; }
.tier-diamond { background:#500724; color:#f472b6; }
.tier-crown { background:#3b0764; color:#c084fc; }
.status-badge { padding:0.2rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:600; }
.status-badge.active { background:#052e16; color:#4ade80; }
.status-badge.inactive { background:#450a0a; color:#f87171; }
.featured-badge { font-size:0.8rem; color:#64748b; }
.featured-badge.yes { color:#fbbf24; }
.date-cell { color:#64748b; font-size:0.8rem; }
.action-row { display:flex; gap:0.5rem; }
.btn-action { width:30px; height:30px; border-radius:6px; border:none; cursor:pointer; font-size:0.85rem; background:#334155; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
.btn-action.blue { background:#1e3a8a; color:#60a5fa; }
.btn-action.warn { background:#451a03; color:#fb923c; }
.btn-action.green { background:#064e3b; color:#4ade80; }
.btn-action.yellow { background:#451a03; color:#fbbf24; }
.btn-action:hover { transform:translateY(-1px); }
.pagination { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border-top:1px solid #334155; }
.btn-page { padding:0.4rem 0.9rem; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#94a3b8; font-size:0.85rem; cursor:pointer; }
.btn-page:disabled { opacity:0.4; cursor:not-allowed; }
.page-info { color:#94a3b8; font-size:0.85rem; }
.total-info { color:#64748b; font-size:0.8rem; margin-left:auto; }

/* Modal Styles */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:100; padding:2rem; }
.modal { background:#1e293b; border-radius:16px; width:100%; max-width:800px; max-height:90vh; border:1px solid #334155; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); }
.modal-header { padding:1.25rem 1.5rem; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center; background:#0f172a; }
.modal-header h3 { color:#f1f5f9; margin:0; font-size:1.1rem; }
.btn-close { background:transparent; border:none; color:#64748b; cursor:pointer; font-size:1.25rem; }
.modal-body { padding:2rem; overflow-y:auto; }

/* Full Profile Layout */
.profile-header { display:flex; gap:2rem; align-items:center; margin-bottom:2.5rem; border-bottom:1px solid #334155; padding-bottom:2rem; }
.large-photo { width:120px; height:120px; border-radius:20px; object-fit:cover; border:3px solid #6366f1; }
.large-avatar { width:120px; height:120px; border-radius:20px; background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center; font-size:3rem; font-weight:800; }
.large-avatar.female { background:#ec4899; }
.header-info h2 { color:#fff; margin:0 0 0.5rem; font-size:1.75rem; }
.profile-id-tag { color:#64748b; font-family:monospace; margin:0 0 1rem; font-size:1rem; }
.header-badges { display:flex; gap:0.75rem; }

.info-section { margin-bottom:2rem; }
.info-section h4 { color:#6366f1; text-transform:uppercase; font-size:0.75rem; letter-spacing:1px; margin:0 0 1rem; border-bottom:1px solid #334155; padding-bottom:0.5rem; }
.info-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:1.25rem; }
.info-item { display:flex; flex-direction:column; gap:0.25rem; }
.info-item .label { color:#64748b; font-size:0.7rem; text-transform:uppercase; font-weight:600; }
.info-item .value { color:#f1f5f9; font-size:0.95rem; }
.bio-row { grid-template-columns:1fr; }
.bio-text { line-height:1.6; color:#94a3b8; }
.tags { display:flex; flex-wrap:wrap; gap:0.5rem; }
.tag { background:#334155; color:#cbd5e1; padding:0.2rem 0.6rem; border-radius:6px; font-size:0.8rem; }
.toast { position:fixed; bottom:2rem; right:2rem; background:#1e293b; border:1px solid #10b981; color:#10b981; padding:0.75rem 1.25rem; border-radius:10px; font-size:0.9rem; font-weight:600; z-index:200; }
    `]
})
export class ProfilesComponent implements OnInit {
    profiles = signal<any[]>([]);
    loading = signal(true);
    page = signal(1);
    pages = signal(1);
    total = signal(0);
    search = '';
    filterGender = '';
    filterTier = '';
    filterActive = '';
    toast = signal('');
    selectedProfile = signal<any>(null);
    private searchTimer: any;

    exportCSV() {
        const token = localStorage.getItem('admin_token');
        const url = `${environment.apiUrl}/admin/export/profiles?token=${token}`;
        window.open(url, '_blank');
    }

    constructor(private api: AdminApiService) { }

    ngOnInit() { this.load(); }

    async load() {
        this.loading.set(true);
        try {
            const res = await this.api.getProfiles({
                page: this.page(), limit: 20,
                gender: this.filterGender, tier: this.filterTier,
                isActive: this.filterActive, search: this.search
            });
            this.profiles.set(res.profiles);
            this.total.set(res.total);
            this.pages.set(res.pages);
        } catch { }
        this.loading.set(false);
    }

    onSearch() {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
    }

    prevPage() { this.page.update(p => p - 1); this.load(); }
    nextPage() { this.page.update(p => p + 1); this.load(); }

    async toggleActive(profile: any) {
        const res = await this.api.deactivateProfile(profile._id);
        profile.isActive = res.isActive;
        this.showToast(res.message);
    }

    async toggleFeature(profile: any) {
        const res = await this.api.featureProfile(profile._id);
        profile.featured = res.featured;
        this.showToast(res.message);
    }

    viewFullProfile(profile: any) {
        this.selectedProfile.set(profile);
    }

    showToast(msg: string) {
        this.toast.set(msg);
        setTimeout(() => this.toast.set(''), 3000);
    }

    onImgError(event: Event) {
        const el = event.target as HTMLImageElement;
        el.style.display = 'none';
    }

    photoUrl(path: string): string {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${environment.backendUrl}${path}`;
    }
}
