import { Component, signal } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminAuthService } from '../../services/admin-auth';
import { filter } from 'rxjs';

interface NavItem { label: string; icon: string; route: string; }

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
<div class="admin-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-brand">
            <span>🛡️</span>
            <span class="brand-text">Admin</span>
        </div>
        <nav class="sidebar-nav">
            @for (item of navItems; track item.route) {
                <a [routerLink]="item.route" class="nav-item" [class.active]="isActive(item.route)">
                    <span class="nav-icon">{{ item.icon }}</span>
                    <span class="nav-label">{{ item.label }}</span>
                </a>
            }
        </nav>
        <div class="sidebar-footer">
            <div class="admin-info">
                <span class="admin-avatar">{{ adminInitial() }}</span>
                <span class="admin-name">{{ adminName() }}</span>
            </div>
            <button class="btn-logout" (click)="logout()">Logout</button>
        </div>
    </aside>

    <!-- Main -->
    <div class="main-area">
        <header class="topbar">
            <h2 class="page-title">{{ pageTitle() }}</h2>
            <span class="topbar-badge">Admin</span>
        </header>
        <main class="page-content">
            <router-outlet></router-outlet>
        </main>
    </div>
</div>`,
    styles: [`
.admin-shell { display:flex; min-height:100vh; background:#0f172a; }
.sidebar { width:220px; min-width:220px; background:#1e293b; display:flex; flex-direction:column; border-right:1px solid #334155; }
.sidebar-brand { display:flex; align-items:center; gap:0.75rem; padding:1.5rem 1.25rem; font-size:1.1rem; font-weight:700; color:#f1f5f9; border-bottom:1px solid #334155; }
.brand-text { color:#f1f5f9; }
.sidebar-nav { flex:1; padding:1rem 0; display:flex; flex-direction:column; gap:0.25rem; }
.nav-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1.25rem; color:#94a3b8; text-decoration:none; border-radius:8px; margin:0 0.5rem; font-size:0.9rem; font-weight:500; transition:all 0.2s; cursor:pointer; }
.nav-item:hover { background:#334155; color:#f1f5f9; }
.nav-item.active { background:#6366f1; color:#fff; }
.nav-icon { font-size:1.1rem; min-width:20px; text-align:center; }
.sidebar-footer { padding:1rem 1.25rem; border-top:1px solid #334155; }
.admin-info { display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem; }
.admin-avatar { width:32px; height:32px; border-radius:50%; background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; }
.admin-name { color:#94a3b8; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
.btn-logout { width:100%; padding:0.5rem; border-radius:8px; border:1px solid #ef4444; background:transparent; color:#ef4444; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
.btn-logout:hover { background:#ef4444; color:#fff; }
.main-area { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.topbar { display:flex; align-items:center; justify-content:space-between; padding:1rem 2rem; background:#1e293b; border-bottom:1px solid #334155; }
.page-title { color:#f1f5f9; font-size:1.25rem; font-weight:700; margin:0; }
.topbar-badge { background:#6366f1; color:#fff; padding:0.25rem 0.75rem; border-radius:20px; font-size:0.75rem; font-weight:600; }
.page-content { flex:1; padding:2rem; overflow-y:auto; }
    `]
})
export class LayoutComponent {
    navItems: NavItem[] = [
        { label: 'Dashboard', icon: '📊', route: '/dashboard' },
        { label: 'Users', icon: '👥', route: '/users' },
        { label: 'Profiles', icon: '👤', route: '/profiles' },
        { label: 'Reports', icon: '🚩', route: '/reports' },
        { label: 'Revenue', icon: '💳', route: '/orders' },
        { label: 'Interests', icon: '💑', route: '/interests' },
        { label: 'Settings', icon: '⚙️', route: '/settings' },
        { label: 'Audit Log', icon: '📋', route: '/audit-log' },
        { label: 'Announcements', icon: '📢', route: '/announcements' },
    ];

    currentRoute = signal('');
    pageTitle = signal('Dashboard');
    adminName = signal('Admin');
    adminInitial = signal('A');

    constructor(private auth: AdminAuthService, private router: Router) {
        const user = this.auth.getUser();
        if (user?.fullName) {
            this.adminName.set(user.fullName);
            this.adminInitial.set(user.fullName.charAt(0).toUpperCase());
        }

        this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
            this.currentRoute.set(e.urlAfterRedirects);
            const item = this.navItems.find(n => e.urlAfterRedirects.startsWith(n.route));
            this.pageTitle.set(item?.label || 'Admin');
        });
    }

    isActive(route: string): boolean {
        return this.currentRoute().startsWith(route);
    }

    logout(): void {
        this.auth.logout();
    }
}
