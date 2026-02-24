/**
 * Route mapping from plain HTML to Angular components:
 *
 * | Plain HTML                    | Component              | Route           |
 * |-------------------------------|------------------------|-----------------|
 * | index.html                    | HomeComponent          | /               |
 * | login.html                    | LoginComponent         | /login          |
 * | membership.html               | MembershipComponent    | /membership     |
 * | create-profile.html           | ProfileWizardComponent | /create-profile |
 * | myphotos.html                 | MyPhotosComponent      | /my-photos      |
 * | userprofile-diamond.html,     | UserProfileComponent   | /profile/:id    |
 * | userprofile-bronze.html,      |                        |                 |
 * | userprofile-gold.html,        |                        |                 |
 * | userprofile-silver.html,      |                        |                 |
 * | userprofile-crown.html        |                        |                 |
 * | myprofile-diamond.html,       | DashboardComponent     | /dashboard      |
 * | myprofile-bronze.html,        |                        |                 |
 * | myprofile-gold.html,          |                        |                 |
 * | myprofile-silver.html,        |                        |                 |
 * | myprofile-crown.html          |                        |                 |
 * | (no plain HTML)               | RegisterComponent      | /register       |
 * | search.html                   | SearchComponent        | /search         |
 * | setting.html                  | SettingsComponent      | /settings       |
 * | profilevisitor.html           | ProfileVisitorComponent| /profile-visitors |
 * | goldprofiles.html             | ProfileListComponent   | /profiles/gold  |
 * | diamondprofiles.html          | ProfileListComponent   | /profiles/diamond |
 */
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth';

export const routes: Routes = [
    // Routes with Full Layout (Navbar, Sidebar, RightSidebar)
    {
        path: '',
        loadComponent: () => import('./components/main-layout').then(m => m.MainLayoutComponent),
        children: [
            { path: '', loadComponent: () => import('./components/home').then(m => m.HomeComponent) },
            { path: 'my-profile', loadComponent: () => import('./components/dashboard').then(m => m.DashboardComponent), canActivate: [authGuard] },
            { path: 'profile/:id', loadComponent: () => import('./components/user-profile').then(m => m.UserProfileComponent), canActivate: [authGuard] },
            { path: 'my-photos', loadComponent: () => import('./components/my-photos').then(m => m.MyPhotosComponent), canActivate: [authGuard] },
            { path: 'membership', loadComponent: () => import('./components/membership').then(m => m.MembershipComponent), canActivate: [authGuard] },
            { path: 'search', loadComponent: () => import('./components/search').then(m => m.SearchComponent) },
            { path: 'settings', loadComponent: () => import('./components/settings').then(m => m.SettingsComponent), canActivate: [authGuard] },
            { path: 'profile-visitors', loadComponent: () => import('./components/profile-visitor').then(m => m.ProfileVisitorComponent), canActivate: [authGuard] },
            { path: 'shortlist', loadComponent: () => import('./components/shortlist').then(m => m.ShortlistComponent), canActivate: [authGuard] },
            { path: 'interests', loadComponent: () => import('./components/interests').then(m => m.InterestsComponent), canActivate: [authGuard] },
            { path: 'chat', loadComponent: () => import('./components/chat/chat').then(m => m.ChatComponent), canActivate: [authGuard] },
            { path: 'my-requirements', loadComponent: () => import('./components/my-requirements').then(m => m.MyRequirementsComponent), canActivate: [authGuard] },
            { path: 'notifications', loadComponent: () => import('./components/notifications').then(m => m.NotificationsComponent), canActivate: [authGuard] },
            { path: 'profiles/:tier', loadComponent: () => import('./components/profile-list').then(m => m.ProfileListComponent) },
        ]
    },
    // Standalone Routes
    { path: 'login', loadComponent: () => import('./components/login').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./components/register').then(m => m.RegisterComponent) },
    { path: 'terms', loadComponent: () => import('./components/terms/terms').then(m => m.TermsComponent) },
    { path: 'privacy', loadComponent: () => import('./components/privacy/privacy').then(m => m.PrivacyComponent) },
    { path: 'create-profile', loadComponent: () => import('./components/profile-wizard').then(m => m.ProfileWizardComponent), canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];
