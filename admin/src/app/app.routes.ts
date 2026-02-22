import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { LoginComponent } from './components/login/login';
import { LayoutComponent } from './components/layout/layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { UsersComponent } from './components/users/users';
import { ProfilesComponent } from './components/profiles/profiles';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: LayoutComponent,
        canActivate: [adminGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'users', component: UsersComponent },
            { path: 'profiles', component: ProfilesComponent },
            // Cursor's routes — placeholders (Cursor will implement components)
            { path: 'reports', loadComponent: () => import('./components/reports/reports').then(m => m.ReportsComponent) },
            { path: 'orders', loadComponent: () => import('./components/orders/orders').then(m => m.OrdersComponent) },
            { path: 'interests', loadComponent: () => import('./components/interests/interests').then(m => m.InterestsComponent) },
            { path: 'settings', loadComponent: () => import('./components/settings/settings').then(m => m.SettingsComponent) },
            { path: 'audit-log', loadComponent: () => import('./components/audit-log/audit-log').then(m => m.AuditLogComponent) },
            { path: 'announcements', loadComponent: () => import('./components/announcements/announcements').then(m => m.AnnouncementsComponent) },
        ]
    },
    { path: '**', redirectTo: '' }
];
