import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="users-page">
    <!-- Top bar -->
    <div class="top-bar">
        <div class="filters">
            <input type="text" [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Search name, email or ID..." class="input-filter">
            <select [(ngModel)]="filterTier" (ngModelChange)="load()" class="select-filter">
                <option value="">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="diamond">Diamond</option>
                <option value="crown">Crown</option>
            </select>
            <select [(ngModel)]="filterVerified" (ngModelChange)="load()" class="select-filter">
                <option value="">All Verified</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
            </select>
            <select [(ngModel)]="filterSuspended" (ngModelChange)="load()" class="select-filter">
                <option value="">All Status</option>
                <option value="false">Active</option>
                <option value="true">Suspended</option>
            </select>
        </div>
        <div class="actions">
            <button class="btn-export" (click)="exportCSV()">Export CSV</button>
            <button class="btn-add" (click)="showCreateModal.set(true)">+ Add User</button>
        </div>
    </div>

    <!-- Table -->
    <div class="table-card">
        @if (loading()) {
            <div class="loading">Loading users...</div>
        } @else {
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Tier</th>
                        <th>Verified</th>
                        <th>Status</th>
                        <th>Admin</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @for (u of users(); track u._id) {
                        <tr [class.suspended-row]="u.isSuspended" (click)="viewUser(u._id)" class="clickable-row">
                            <td>
                                <div class="user-cell">
                                    @if (u.profile?.profilePhotoUrl) {
                                        <img [src]="photoUrl(u.profile.profilePhotoUrl)" class="user-photo" alt="photo" (error)="onImgError($event)">
                                    } @else {
                                        <div class="user-avatar">{{ u.fullName?.charAt(0) || '?' }}</div>
                                    }
                                    <div>
                                        <div class="user-name">{{ u.profile?.fullName || u.fullName }}</div>
                                        <div class="user-email">{{ u.email }}</div>
                                    </div>
                                </div>
                            </td>
                            <td><span class="tier-badge tier-{{ u.membershipTier }}">{{ u.membershipTier }}</span></td>
                            <td>
                                <span class="status-dot" [class.green]="u.verified" [class.gray]="!u.verified">
                                    {{ u.verified ? '✓' : '○' }}
                                </span>
                            </td>
                            <td><span class="status-badge" [class.active]="!u.isSuspended" [class.suspended]="u.isSuspended">{{ u.isSuspended ? 'Suspended' : 'Active' }}</span></td>
                            <td><span class="admin-flag" [class.yes]="u.isAdmin">{{ u.isAdmin ? '🛡️' : '—' }}</span></td>
                            <td class="date-cell">{{ u.createdAt | date:'mediumDate' }}</td>
                            <td>
                                <div class="action-row" (click)="$event.stopPropagation()">
                                    @if (!u.verified) {
                                        <button class="btn-action green" (click)="verify(u)" title="Verify">✓</button>
                                    }
                                    <button class="btn-action" [class.warn]="!u.isSuspended" [class.green]="u.isSuspended" (click)="suspend(u)" [title]="u.isSuspended ? 'Unsuspend' : 'Suspend'">{{ u.isSuspended ? '🔓' : '🔒' }}</button>
                                    <button class="btn-action red" (click)="confirmDelete(u)" title="Delete">🗑</button>
                                </div>
                            </td>
                        </tr>
                    } @empty {
                        <tr><td colspan="7" class="empty-row">No users found.</td></tr>
                    }
                </tbody>
            </table>
            <div class="pagination">
                <button class="btn-page" [disabled]="page() <= 1" (click)="prevPage()">← Prev</button>
                <span class="page-info">Page {{ page() }} of {{ pages() }}</span>
                <button class="btn-page" [disabled]="page() >= pages()" (click)="nextPage()">Next →</button>
                <span class="total-info">{{ total() }} total users</span>
            </div>
        }
    </div>

    <!-- User Detail Drawer -->
    @if (detailUser()) {
        <div class="drawer-overlay" (click)="detailUser.set(null)">
            <div class="drawer" (click)="$event.stopPropagation()">
                <div class="drawer-header">
                    <h3>User Details</h3>
                    <button class="btn-close" (click)="detailUser.set(null)">✕</button>
                </div>
                <div class="drawer-body">
                    @if (detailUser()?.profile?.profilePhotoUrl) {
                        <img [src]="photoUrl(detailUser()?.profile?.profilePhotoUrl)" class="detail-photo" alt="photo" (error)="onImgError($event)">
                    } @else {
                        <div class="detail-avatar">{{ detailUser()?.user?.fullName?.charAt(0) || '?' }}</div>
                    }
                    <h4 class="detail-name">{{ detailUser()?.profile?.fullName || detailUser()?.user?.fullName }}</h4>
                    @if (detailUser()?.profile?.fullName && detailUser()?.profile?.fullName !== detailUser()?.user?.fullName) {
                        <p class="detail-account-name">Account: {{ detailUser()?.user?.fullName }}</p>
                    }
                    <p class="detail-email">{{ detailUser()?.user?.email }}</p>

                    <div class="detail-grid">
                        <div class="detail-item"><span class="detail-label">ID</span><span class="detail-value mono">{{ detailUser()?.user?._id }}</span></div>
                        <div class="detail-item"><span class="detail-label">Gender</span><span class="detail-value">{{ detailUser()?.user?.gender || '—' }}</span></div>
                        <div class="detail-item"><span class="detail-label">Tier</span><span class="detail-value"><span class="tier-badge tier-{{ detailUser()?.user?.membershipTier }}">{{ detailUser()?.user?.membershipTier }}</span></span></div>
                        <div class="detail-item"><span class="detail-label">Verified</span><span class="detail-value">{{ detailUser()?.user?.verified ? 'Yes ✓' : 'No' }}</span></div>
                        <div class="detail-item"><span class="detail-label">Admin</span><span class="detail-value">{{ detailUser()?.user?.isAdmin ? 'Yes 🛡️' : 'No' }}</span></div>
                        <div class="detail-item"><span class="detail-label">Suspended</span><span class="detail-value">{{ detailUser()?.user?.isSuspended ? 'Yes ⛔' : 'No' }}</span></div>
                        <div class="detail-item"><span class="detail-label">Joined</span><span class="detail-value">{{ detailUser()?.user?.createdAt | date:'medium' }}</span></div>
                    </div>

                    @if (detailUser()?.profile) {
                        <div class="full-profile-trigger">
                            <button class="btn-full-profile" (click)="showFullProfileModal.set(true)">View Full Profile Details</button>
                        </div>
                        <h4 class="section-title">Profile Summary</h4>
                        <div class="detail-grid">
                            <div class="detail-item"><span class="detail-label">Profile ID</span><span class="detail-value mono">{{ detailUser()?.profile?.profileId || detailUser()?.profile?._id }}</span></div>
                            <div class="detail-item"><span class="detail-label">Religion</span><span class="detail-value">{{ detailUser()?.profile?.religion || '—' }}</span></div>
                            <div class="detail-item"><span class="detail-label">State</span><span class="detail-value">{{ detailUser()?.profile?.state || '—' }}</span></div>
                            <div class="detail-item"><span class="detail-label">Occupation</span><span class="detail-value">{{ detailUser()?.profile?.occupation || '—' }}</span></div>
                        </div>
                    } @else {
                        <p class="no-profile">No profile created yet.</p>
                    }

                    <!-- Change Tier -->
                    <h4 class="section-title">Change Membership</h4>
                    <div class="tier-change">
                        <select [(ngModel)]="changeTier" class="select-filter">
                            <option value="bronze">Bronze</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="diamond">Diamond</option>
                            <option value="crown">Crown</option>
                        </select>
                        <button class="btn-tier" (click)="applyTier()">Apply</button>
                    </div>
                </div>
            </div>
        </div>
    }

    <!-- Full Profile Modal (shared structure with ProfilesComponent) -->
    @if (showFullProfileModal() && detailUser()?.profile) {
        <div class="modal-overlay" style="z-index: 110;" (click)="showFullProfileModal.set(false)">
            <div class="modal full-profile-modal" (click)="$event.stopPropagation()">
                <div class="modal-header">
                    <h3>Full Profile: {{ detailUser()?.profile?.fullName }}</h3>
                    <button class="btn-close" (click)="showFullProfileModal.set(false)">✕</button>
                </div>
                <div class="modal-body">
                    <div class="profile-header">
                        <div class="header-photo">
                            @if (detailUser()?.profile?.profilePhotoUrl) {
                                <img [src]="photoUrl(detailUser()?.profile?.profilePhotoUrl)" class="large-photo" alt="photo">
                            } @else {
                                <div class="large-avatar" [class.female]="detailUser()?.profile?.gender === 'female'">{{ detailUser()?.profile?.fullName?.charAt(0) || '?' }}</div>
                            }
                        </div>
                        <div class="header-info">
                            <h2>{{ detailUser()?.profile?.fullName }}</h2>
                            <p class="profile-id-tag">{{ detailUser()?.profile?.profileId }}</p>
                            <div class="header-badges">
                                <span class="tier-badge tier-{{ detailUser()?.user?.membershipTier || 'bronze' }}">{{ detailUser()?.user?.membershipTier || 'bronze' }}</span>
                                <span class="status-badge" [class.active]="detailUser()?.profile?.isActive !== false">{{ detailUser()?.profile?.isActive === false ? 'Inactive' : 'Active' }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-sections">
                        <section class="info-section">
                            <h4>Basic Details</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Gender</span><span class="value">{{ detailUser()?.profile?.gender }}</span></div>
                                <div class="info-item"><span class="label">DOB</span><span class="value">{{ detailUser()?.profile?.dateOfBirth || '—' }}</span></div>
                                <div class="info-item"><span class="label">Height</span><span class="value">{{ detailUser()?.profile?.height || '—' }}</span></div>
                                <div class="info-item"><span class="label">Marital Status</span><span class="value">{{ detailUser()?.profile?.maritalStatus || '—' }}</span></div>
                                <div class="info-item"><span class="label">Mother Tongue</span><span class="value">{{ detailUser()?.profile?.motherTongue || '—' }}</span></div>
                            </div>
                        </section>

                        <section class="info-section">
                            <h4>Religion & Culture</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Religion</span><span class="value">{{ detailUser()?.profile?.religion || '—' }}</span></div>
                                <div class="info-item"><span class="label">Caste</span><span class="value">{{ detailUser()?.profile?.caste || '—' }}</span></div>
                                <div class="info-item"><span class="label">Gothra</span><span class="value">{{ detailUser()?.profile?.gothra || '—' }}</span></div>
                                <div class="info-item"><span class="label">Manglik</span><span class="value">{{ detailUser()?.profile?.manglik || '—' }}</span></div>
                            </div>
                        </section>

                        <section class="info-section">
                            <h4>Education & Career</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Education</span><span class="value">{{ detailUser()?.profile?.highestEducation || '—' }}</span></div>
                                <div class="info-item"><span class="label">Degree</span><span class="value">{{ detailUser()?.profile?.degree || '—' }}</span></div>
                                <div class="info-item"><span class="label">Occupation</span><span class="value">{{ detailUser()?.profile?.occupation || '—' }}</span></div>
                                <div class="info-item"><span class="label">Company</span><span class="value">{{ detailUser()?.profile?.company || '—' }}</span></div>
                                <div class="info-item"><span class="label">Income</span><span class="value">{{ detailUser()?.profile?.monthlyIncome || '—' }}</span></div>
                            </div>
                        </section>

                        <section class="info-section">
                            <h4>Family Details</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Father Status</span><span class="value">{{ detailUser()?.profile?.fatherStatus || '—' }}</span></div>
                                <div class="info-item"><span class="label">Mother Status</span><span class="value">{{ detailUser()?.profile?.motherStatus || '—' }}</span></div>
                                <div class="info-item"><span class="label">Siblings</span><span class="value">{{ detailUser()?.profile?.siblings || '—' }}</span></div>
                                <div class="info-item"><span class="label">Family Type</span><span class="value">{{ detailUser()?.profile?.familyType || '—' }}</span></div>
                                <div class="info-item"><span class="label">Family Values</span><span class="value">{{ detailUser()?.profile?.familyValues || '—' }}</span></div>
                                <div class="info-item"><span class="label">Father Name</span><span class="value">{{ detailUser()?.profile?.fatherName || '—' }}</span></div>
                                <div class="info-item"><span class="label">Mother Name</span><span class="value">{{ detailUser()?.profile?.motherName || '—' }}</span></div>
                            </div>
                        </section>

                        <section class="info-section">
                            <h4>Location</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Country</span><span class="value">{{ detailUser()?.profile?.country }}</span></div>
                                <div class="info-item"><span class="label">State</span><span class="value">{{ detailUser()?.profile?.state }}</span></div>
                                <div class="info-item"><span class="label">District</span><span class="value">{{ detailUser()?.profile?.district }}</span></div>
                                <div class="info-item"><span class="label">City</span><span class="value">{{ detailUser()?.profile?.city || '—' }}</span></div>
                                <div class="info-item"><span class="label">Pin Code</span><span class="value">{{ detailUser()?.profile?.pinCode || '—' }}</span></div>
                            </div>
                        </section>

                        <section class="info-section">
                            <h4>Lifestyle & Bio</h4>
                            <div class="info-grid bio-row">
                                <div class="info-item"><span class="label">Bio</span><span class="value bio-text">{{ detailUser()?.profile?.bio || 'No bio provided.' }}</span></div>
                            </div>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Diet</span><span class="value">{{ detailUser()?.profile?.diet || '—' }}</span></div>
                                <div class="info-item"><span class="label">Smoking</span><span class="value">{{ detailUser()?.profile?.smoking || '—' }}</span></div>
                                <div class="info-item"><span class="label">Drinking</span><span class="value">{{ detailUser()?.profile?.drinking || '—' }}</span></div>
                            </div>
                            <div class="info-grid hobbies-row">
                                <div class="info-item"><span class="label">Hobbies</span><span class="value">
                                    <div class="tags">
                                        @for (h of detailUser()?.profile?.hobbies; track h) {
                                            <span class="tag">{{ h }}</span>
                                        } @empty { — }
                                    </div>
                                </span></div>
                            </div>
                        </section>
                        
                        <section class="info-section partner-section">
                            <h4>Partner Preferences</h4>
                            <div class="info-grid">
                                <div class="info-item"><span class="label">Age Range</span><span class="value">
                                    {{ detailUser()?.profile?.partnerPreferences?.ageRange?.min || '18' }} - 
                                    {{ detailUser()?.profile?.partnerPreferences?.ageRange?.max || '99' }} yrs
                                </span></div>
                                <div class="info-item"><span class="label">Religion</span><span class="value">
                                    <div class="tags">
                                        @for (r of detailUser()?.profile?.partnerPreferences?.religion; track r) {
                                            <span class="tag">{{ r }}</span>
                                        } @empty { — }
                                    </div>
                                </span></div>
                                <div class="info-item"><span class="label">State</span><span class="value">
                                    <div class="tags">
                                        @for (s of detailUser()?.profile?.partnerPreferences?.state; track s) {
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

    <!-- Create User Modal -->
    @if (showCreateModal()) {
        <div class="modal-overlay" (click)="showCreateModal.set(false)">
            <div class="modal create-modal" (click)="$event.stopPropagation()">
                <h3>Create New User</h3>
                <form (ngSubmit)="createUser()" class="create-form">
                    <div class="form-row">
                        <label>Full Name *</label>
                        <input type="text" [(ngModel)]="newUser.fullName" name="fullName" required class="input">
                    </div>
                    <div class="form-row">
                        <label>Email *</label>
                        <input type="email" [(ngModel)]="newUser.email" name="email" required class="input">
                    </div>
                    <div class="form-row">
                        <label>Password *</label>
                        <input type="password" [(ngModel)]="newUser.password" name="password" required class="input">
                    </div>
                    <div class="form-row-half">
                        <div class="form-row">
                            <label>Gender</label>
                            <select [(ngModel)]="newUser.gender" name="gender" class="input">
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="others">Others</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>Tier</label>
                            <select [(ngModel)]="newUser.membershipTier" name="tier" class="input">
                                <option value="bronze">Bronze</option>
                                <option value="silver">Silver</option>
                                <option value="gold">Gold</option>
                                <option value="diamond">Diamond</option>
                                <option value="crown">Crown</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row-half">
                        <label class="checkbox-label"><input type="checkbox" [(ngModel)]="newUser.verified" name="verified"> Verified</label>
                        <label class="checkbox-label"><input type="checkbox" [(ngModel)]="newUser.isAdmin" name="isAdmin"> Admin</label>
                    </div>
                    @if (createError()) {
                        <div class="error-msg">{{ createError() }}</div>
                    }
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" (click)="showCreateModal.set(false)">Cancel</button>
                        <button type="submit" class="btn-create" [disabled]="creating()">{{ creating() ? 'Creating...' : 'Create User' }}</button>
                    </div>
                </form>
            </div>
        </div>
    }

    <!-- Confirm Delete Modal -->
    @if (deleteTarget()) {
        <div class="modal-overlay" (click)="deleteTarget.set(null)">
            <div class="modal" (click)="$event.stopPropagation()">
                <h3>Delete User?</h3>
                <p>This will permanently delete <strong>{{ deleteTarget()?.fullName }}</strong> and their profile. This cannot be undone.</p>
                <div class="modal-actions">
                    <button class="btn-cancel" (click)="deleteTarget.set(null)">Cancel</button>
                    <button class="btn-delete" (click)="deleteUser()">Delete</button>
                </div>
            </div>
        </div>
    }

    @if (toast()) {
        <div class="toast">{{ toast() }}</div>
    }
</div>`,
    styles: [`
.users-page { display:flex; flex-direction:column; gap:1.25rem; }
.top-bar { display:flex; gap:0.75rem; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; }
.filters { display:flex; gap:0.75rem; flex-wrap:wrap; flex:1; }
.input-filter,.select-filter { padding:0.6rem 0.9rem; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#f1f5f9; font-size:0.9rem; outline:none; }
.input-filter { flex:1; min-width:200px; }
.input-filter:focus,.select-filter:focus { border-color:#6366f1; }
.btn-add, .btn-export { padding:0.6rem 1.25rem; border-radius:8px; border:none; color:#fff; font-size:0.9rem; font-weight:700; cursor:pointer; white-space:nowrap; transition:all 0.2s; }
.btn-add { background:#6366f1; }
.btn-add:hover { background:#4f46e5; transform:translateY(-1px); }
.btn-export { background:#0f172a; border:1px solid #334155; color:#94a3b8; }
.btn-export:hover { background:#1e293b; color:#fff; }
.actions { display:flex; gap:0.75rem; }
.table-card { background:#1e293b; border-radius:12px; border:1px solid #334155; overflow:hidden; }
.loading,.empty-row { color:#94a3b8; text-align:center; padding:3rem; }
.admin-table { width:100%; border-collapse:collapse; }
thead tr { background:#0f172a; }
th { color:#64748b; font-size:0.75rem; text-transform:uppercase; letter-spacing:.5px; padding:0.75rem 1rem; text-align:left; }
td { padding:0.85rem 1rem; border-top:1px solid #334155; color:#f1f5f9; font-size:0.9rem; vertical-align:middle; }
.clickable-row { cursor:pointer; transition:background 0.15s; }
.clickable-row:hover { background:#334155; }
.suspended-row td { opacity:0.65; }
.user-cell { display:flex; align-items:center; gap:0.75rem; }
.user-avatar { width:36px; height:36px; border-radius:50%; background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem; flex-shrink:0; }
.user-photo { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #334155; flex-shrink:0; }
.user-name { font-weight:600; color:#f1f5f9; font-size:0.9rem; }
.user-email { color:#64748b; font-size:0.8rem; }
.tier-badge { padding:0.25rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:700; text-transform:uppercase; }
.tier-bronze { background:#7c3516; color:#fb923c; }
.tier-silver { background:#1e3a5f; color:#94a3b8; }
.tier-gold { background:#713f12; color:#fbbf24; }
.tier-diamond { background:#500724; color:#f472b6; }
.tier-crown { background:#3b0764; color:#c084fc; }
.status-dot { font-size:1rem; }
.status-dot.green { color:#10b981; }
.status-dot.gray { color:#475569; }
.status-badge { padding:0.2rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:600; }
.status-badge.active { background:#052e16; color:#4ade80; }
.status-badge.suspended { background:#450a0a; color:#f87171; }
.admin-flag { font-size:0.9rem; color:#64748b; }
.admin-flag.yes { color:#6366f1; }
.date-cell { color:#64748b; font-size:0.8rem; }
.action-row { display:flex; gap:0.5rem; align-items:center; }
.btn-action { width:30px; height:30px; border-radius:6px; border:none; cursor:pointer; font-size:0.85rem; background:#334155; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
.btn-action.green { background:#064e3b; color:#4ade80; }
.btn-action.warn { background:#451a03; color:#fb923c; }
.btn-action.red { background:#450a0a; color:#f87171; }
.btn-action:hover { transform:translateY(-1px); }
.pagination { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border-top:1px solid #334155; }
.btn-page { padding:0.4rem 0.9rem; border-radius:6px; border:1px solid #334155; background:#0f172a; color:#94a3b8; font-size:0.85rem; cursor:pointer; }
.btn-page:disabled { opacity:0.4; cursor:not-allowed; }
.page-info { color:#94a3b8; font-size:0.85rem; }
.total-info { color:#64748b; font-size:0.8rem; margin-left:auto; }

/* Drawer */
.drawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:100; display:flex; justify-content:flex-end; }
.drawer { width:460px; max-width:95vw; background:#1e293b; height:100vh; overflow-y:auto; border-left:1px solid #334155; animation:slideIn 0.2s ease; }
@keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
.drawer-header { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #334155; }
.drawer-header h3 { color:#f1f5f9; margin:0; font-size:1.1rem; }
.btn-close { background:transparent; border:none; color:#94a3b8; font-size:1.25rem; cursor:pointer; }
.drawer-body { padding:1.5rem; display:flex; flex-direction:column; align-items:center; gap:1rem; }
.detail-avatar { width:60px; height:60px; border-radius:50%; background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.25rem; }
.detail-photo { width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid #334155; }
.detail-name { color:#f1f5f9; font-size:1.1rem; margin:0; }
.detail-account-name { color:#64748b; font-size:0.8rem; margin:0; }
.detail-email { color:#64748b; font-size:0.85rem; margin:0; }
.detail-grid { width:100%; display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
.detail-item { display:flex; flex-direction:column; gap:0.15rem; }
.detail-label { color:#64748b; font-size:0.72rem; text-transform:uppercase; letter-spacing:.5px; }
.detail-value { color:#f1f5f9; font-size:0.9rem; }
.detail-value.mono { font-family:monospace; font-size:0.8rem; color:#94a3b8; word-break:break-all; }
.section-title { color:#f1f5f9; font-size:0.95rem; margin:0.5rem 0 0; align-self:flex-start; border-top:1px solid #334155; padding-top:1rem; width:100%; }
.no-profile { color:#64748b; font-size:0.85rem; align-self:flex-start; }
.full-profile-trigger { width:100%; padding-top:0.5rem; }
.btn-full-profile { width:100%; padding:0.75rem; border-radius:8px; border:1px solid #6366f1; background:rgba(99,102,241,0.1); color:#6366f1; font-weight:700; cursor:pointer; transition:all 0.2s; }
.btn-full-profile:hover { background:rgba(99,102,241,0.2); }
.tier-change { display:flex; gap:0.5rem; width:100%; }
.tier-change .select-filter { flex:1; }
.btn-tier { padding:0.6rem 1.25rem; border-radius:8px; border:none; background:#6366f1; color:#fff; font-weight:700; cursor:pointer; font-size:0.85rem; }

/* Modal Styles */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:100; padding:2rem; }
.modal { background:#1e293b; border-radius:16px; width:100%; max-width:800px; max-height:90vh; border:1px solid #334155; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); }
.modal-header { padding:1.25rem 1.5rem; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center; background:#0f172a; }
.modal-header h3 { color:#f1f5f9; margin:0; font-size:1.1rem; }
.modal-body { padding:2rem; overflow-y:auto; }

/* Shared Profile Layout */
.profile-header { display:flex; gap:2rem; align-items:center; margin-bottom:2.5rem; border-bottom:1px solid #334155; padding-bottom:2rem; }
.large-photo { width:100px; height:100px; border-radius:15px; object-fit:cover; border:3px solid #6366f1; }
.large-avatar { width:100px; height:100px; border-radius:15px; background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center; font-size:2.5rem; font-weight:800; }
.large-avatar.female { background:#ec4899; }
.header-info h2 { color:#fff; margin:0 0 0.25rem; font-size:1.5rem; }
.profile-id-tag { color:#64748b; font-family:monospace; margin:0 0 0.75rem; font-size:0.95rem; }
.header-badges { display:flex; gap:0.5rem; }

.info-section { margin-bottom:2rem; }
.info-section h4 { color:#6366f1; text-transform:uppercase; font-size:0.75rem; letter-spacing:1px; margin:0 0 1rem; border-bottom:1px solid #334155; padding-bottom:0.4rem; }
.info-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:1.25rem; }
.info-item { display:flex; flex-direction:column; gap:0.2rem; }
.info-item .label { color:#64748b; font-size:0.65rem; text-transform:uppercase; font-weight:600; }
.info-item .value { color:#f1f5f9; font-size:0.9rem; }
.bio-row { grid-template-columns:1fr; }
.bio-text { line-height:1.6; color:#94a3b8; font-size:0.9rem; }
.tags { display:flex; flex-wrap:wrap; gap:0.4rem; }
.tag { background:#334155; color:#cbd5e1; padding:0.15rem 0.5rem; border-radius:5px; font-size:0.75rem; }

/* Existing Create/Delete Modals */
.create-modal { max-width:500px; }
.modal h3 { color:#f1f5f9; margin:0; }
.modal p { color:#94a3b8; margin:0 0 1.5rem; line-height:1.6; }
.create-form { display:flex; flex-direction:column; gap:1rem; padding-top:1.5rem; }
.form-row { display:flex; flex-direction:column; gap:0.35rem; }
.form-row label { color:#94a3b8; font-size:0.8rem; font-weight:600; }
.input { padding:0.6rem 0.9rem; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#f1f5f9; font-size:0.9rem; outline:none; }
.input:focus { border-color:#6366f1; }
.form-row-half { display:flex; gap:1rem; }
.form-row-half .form-row { flex:1; }
.checkbox-label { color:#94a3b8; font-size:0.85rem; display:flex; align-items:center; gap:0.5rem; cursor:pointer; }
.error-msg { background:#7f1d1d; color:#fca5a5; padding:0.6rem 1rem; border-radius:8px; font-size:0.85rem; }
.modal-actions { display:flex; gap:0.75rem; justify-content:flex-end; margin-top:0.5rem; }
.btn-cancel { padding:0.6rem 1.25rem; border-radius:8px; border:1px solid #334155; background:transparent; color:#94a3b8; cursor:pointer; }
.btn-create { padding:0.6rem 1.25rem; border-radius:8px; border:none; background:#6366f1; color:#fff; font-weight:700; cursor:pointer; }
.btn-create:disabled { opacity:0.6; cursor:not-allowed; }
.btn-delete { padding:0.6rem 1.25rem; border-radius:8px; border:none; background:#ef4444; color:#fff; font-weight:700; cursor:pointer; }
.toast { position:fixed; bottom:2rem; right:2rem; background:#1e293b; border:1px solid #10b981; color:#10b981; padding:0.75rem 1.25rem; border-radius:10px; font-size:0.9rem; font-weight:600; z-index:200; }
    `]
})
export class UsersComponent implements OnInit {
    users = signal<any[]>([]);
    loading = signal(true);
    page = signal(1);
    pages = signal(1);
    total = signal(0);
    search = '';
    filterTier = '';
    filterVerified = '';
    filterSuspended = '';
    deleteTarget = signal<any>(null);
    toast = signal('');
    private searchTimer: any;

    // User detail drawer
    detailUser = signal<any>(null);
    changeTier = 'bronze';
    showFullProfileModal = signal(false);

    // Create user modal
    showCreateModal = signal(false);
    creating = signal(false);
    createError = signal('');
    newUser: any = { fullName: '', email: '', password: '', gender: '', membershipTier: 'bronze', verified: false, isAdmin: false };

    exportCSV() {
        const token = localStorage.getItem('admin_token');
        const url = `${environment.apiUrl}/admin/export/users?token=${token}`;
        window.open(url, '_blank');
    }

    constructor(private api: AdminApiService) { }

    ngOnInit() { this.load(); }

    async load() {
        this.loading.set(true);
        try {
            const res = await this.api.getUsers({
                page: this.page(), limit: 20,
                tier: this.filterTier, verified: this.filterVerified,
                suspended: this.filterSuspended, search: this.search
            });
            this.users.set(res.users);
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

    async verify(user: any) {
        await this.api.verifyUser(user._id);
        user.verified = true;
        this.showToast('User verified ✓');
    }

    async suspend(user: any) {
        const res = await this.api.suspendUser(user._id);
        user.isSuspended = res.isSuspended;
        this.showToast(res.isSuspended ? 'User suspended.' : 'User unsuspended.');
    }

    confirmDelete(user: any) { this.deleteTarget.set(user); }

    async deleteUser() {
        const user = this.deleteTarget();
        if (!user) return;
        await this.api.deleteUser(user._id);
        this.deleteTarget.set(null);
        this.showToast('User deleted.');
        this.load();
    }

    // View user detail
    async viewUser(id: string) {
        try {
            const data = await this.api.getUser(id);
            this.changeTier = data.user?.membershipTier || 'bronze';
            this.detailUser.set(data);
        } catch {
            this.showToast('Failed to load user details.');
        }
    }

    async applyTier() {
        const u = this.detailUser();
        if (!u?.user?._id) return;
        await this.api.setMembership(u.user._id, this.changeTier);
        u.user.membershipTier = this.changeTier;
        this.detailUser.set({ ...u });
        this.showToast(`Tier updated to ${this.changeTier}.`);
        this.load(); // refresh table
    }

    // Create user
    async createUser() {
        this.creating.set(true);
        this.createError.set('');
        try {
            await this.api.createUser(this.newUser);
            this.showCreateModal.set(false);
            this.newUser = { fullName: '', email: '', password: '', gender: '', membershipTier: 'bronze', verified: false, isAdmin: false };
            this.showToast('User created ✓');
            this.load();
        } catch (e: any) {
            this.createError.set(e.error?.message || 'Failed to create user.');
        } finally {
            this.creating.set(false);
        }
    }

    showToast(msg: string) {
        this.toast.set(msg);
        setTimeout(() => this.toast.set(''), 3000);
    }

    photoUrl(path: string): string {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${environment.backendUrl}${path}`;
    }

    onImgError(event: Event) {
        const el = event.target as HTMLImageElement;
        el.style.display = 'none';
    }
}
