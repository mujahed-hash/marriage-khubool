import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="login-page">
    <div class="login-card">
        <div class="login-logo">
            <span class="login-icon">🛡️</span>
            <h1>Admin Portal</h1>
            <p>Khubool Hai — Administration</p>
        </div>
        <form (ngSubmit)="onLogin()" class="login-form">
            <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="email" name="email" required placeholder="admin@example.com" class="input">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" class="input">
            </div>
            @if (error()) {
                <div class="error-msg">{{ error() }}</div>
            }
            <button type="submit" class="btn-login" [disabled]="loading()">
                {{ loading() ? 'Signing in...' : 'Sign In' }}
            </button>
        </form>
    </div>
</div>`,
    styles: [`
.login-page { min-height:100vh; background:#0f172a; display:flex; align-items:center; justify-content:center; }
.login-card { background:#1e293b; border-radius:16px; padding:2.5rem; width:100%; max-width:400px; box-shadow:0 25px 50px rgba(0,0,0,0.4); }
.login-logo { text-align:center; margin-bottom:2rem; }
.login-icon { font-size:3rem; }
h1 { color:#f1f5f9; font-size:1.5rem; margin:0.5rem 0 0.25rem; }
p { color:#64748b; margin:0; font-size:0.9rem; }
.login-form { display:flex; flex-direction:column; gap:1.25rem; }
.form-group { display:flex; flex-direction:column; gap:0.4rem; }
label { color:#94a3b8; font-size:0.85rem; font-weight:600; }
.input { padding:0.75rem 1rem; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#f1f5f9; font-size:0.95rem; outline:none; transition:border-color 0.2s; }
.input:focus { border-color:#6366f1; }
.btn-login { padding:0.85rem; border-radius:10px; border:none; background:#6366f1; color:#fff; font-size:1rem; font-weight:700; cursor:pointer; transition:all 0.2s; }
.btn-login:hover:not(:disabled) { background:#4f46e5; transform:translateY(-1px); }
.btn-login:disabled { opacity:0.6; cursor:not-allowed; }
.error-msg { background:#7f1d1d; color:#fca5a5; padding:0.65rem 1rem; border-radius:8px; font-size:0.85rem; }
    `]
})
export class LoginComponent {
    email = '';
    password = '';
    loading = signal(false);
    error = signal('');

    constructor(private auth: AdminAuthService, private router: Router) {
        if (this.auth.isLoggedIn()) this.router.navigate(['/']);
    }

    async onLogin() {
        this.loading.set(true);
        this.error.set('');
        try {
            await this.auth.login(this.email, this.password);
            this.router.navigate(['/']);
        } catch (e: any) {
            this.error.set(e.error?.message || e.message || 'Login failed.');
        } finally {
            this.loading.set(false);
        }
    }
}
