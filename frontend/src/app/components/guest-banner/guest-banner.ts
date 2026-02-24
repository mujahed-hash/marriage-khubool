import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

const DISMISS_KEY = 'khubool_guest_banner_dismissed';

@Component({
    selector: 'app-guest-banner',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
@if (visible()) {
<div class="guest-banner">
    <span class="guest-banner-icon"><i class="fa-solid fa-heart"></i></span>
    <span class="guest-banner-text">Join free to connect with verified profiles</span>
    <a routerLink="/register" class="guest-banner-cta">Create Free Profile</a>
    <button type="button" class="guest-banner-dismiss" (click)="dismiss()" aria-label="Dismiss">
        <i class="fa-solid fa-xmark"></i>
    </button>
</div>
}`,
    styles: [`
.guest-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: linear-gradient(135deg, var(--tier-primary, #db2777) 0%, #be185d 100%);
    color: #fff;
    position: sticky;
    top: 0;
    z-index: 99;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.guest-banner-icon { font-size: 1rem; }
.guest-banner-text { font-weight: 500; }
.guest-banner-cta {
    padding: 0.35rem 0.75rem;
    background: #fff;
    color: var(--tier-primary, #db2777);
    border-radius: 6px;
    font-weight: 600;
    text-decoration: none;
    font-size: 0.85rem;
}
.guest-banner-cta:hover { opacity: 0.9; }
.guest-banner-dismiss {
    margin-left: auto;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.9);
    cursor: pointer;
    padding: 0.25rem;
    font-size: 1rem;
}
.guest-banner-dismiss:hover { color: #fff; }
    `]
})
export class GuestBannerComponent {
    private authService = inject(AuthService);
    visible = signal(false);

    constructor() {
        if (!this.authService.isAuthenticated() && !localStorage.getItem(DISMISS_KEY)) {
            this.visible.set(true);
        }
    }

    dismiss() {
        localStorage.setItem(DISMISS_KEY, '1');
        this.visible.set(false);
    }
}
