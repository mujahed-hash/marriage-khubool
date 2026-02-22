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
import { MainLayoutComponent } from './components/main-layout';
import { HomeComponent } from './components/home';
import { MembershipComponent } from './components/membership';
import { LoginComponent } from './components/login';
import { RegisterComponent } from './components/register';
import { ProfileWizardComponent } from './components/profile-wizard';
import { MyPhotosComponent } from './components/my-photos';
import { UserProfileComponent } from './components/user-profile';
import { DashboardComponent } from './components/dashboard';
import { SearchComponent } from './components/search';
import { SettingsComponent } from './components/settings';
import { ProfileVisitorComponent } from './components/profile-visitor';
import { ProfileListComponent } from './components/profile-list';
import { ShortlistComponent } from './components/shortlist';
import { InterestsComponent } from './components/interests';
import { ChatComponent } from './components/chat/chat';
import { MyRequirementsComponent } from './components/my-requirements';
import { TermsComponent } from './components/terms/terms';
import { PrivacyComponent } from './components/privacy/privacy';
import { NotificationsComponent } from './components/notifications';
import { authGuard } from './guards/auth';

export const routes: Routes = [
    // Routes with Full Layout (Navbar, Sidebar, RightSidebar)
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            { path: '', component: HomeComponent },
            { path: 'my-profile', component: DashboardComponent, canActivate: [authGuard] },
            { path: 'profile/:id', component: UserProfileComponent, canActivate: [authGuard] },
            { path: 'my-photos', component: MyPhotosComponent, canActivate: [authGuard] },
            { path: 'membership', component: MembershipComponent, canActivate: [authGuard] },
            { path: 'search', component: SearchComponent },
            { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
            { path: 'profile-visitors', component: ProfileVisitorComponent, canActivate: [authGuard] },
            { path: 'shortlist', component: ShortlistComponent, canActivate: [authGuard] },
            { path: 'interests', component: InterestsComponent, canActivate: [authGuard] },
            { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
            { path: 'my-requirements', component: MyRequirementsComponent, canActivate: [authGuard] },
            { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
            { path: 'profiles/:tier', component: ProfileListComponent },
        ]
    },
    // Standalone Routes
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'terms', component: TermsComponent },
    { path: 'privacy', component: PrivacyComponent },
    { path: 'create-profile', component: ProfileWizardComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];
