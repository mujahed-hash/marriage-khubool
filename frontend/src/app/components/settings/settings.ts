import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SettingsService } from '../../services/settings.service';
import { ProfileService } from '../../services/profile';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './settings.html',
    styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
    loading = signal(true);
    saving = signal(false);
    message = signal('');
    profileActive = signal(true);
    togglingActive = signal(false);

    notifications = {
        emailOnInterest: true,
        emailOnVisitor: true,
        emailOnShortlist: false
    };

    privacy = {
        showContactInfo: true,
        showLastSeen: true,
        profileVisibility: 'everyone'
    };

    private settingsService = inject(SettingsService);
    private profileService = inject(ProfileService);
    private api = inject(ApiService);

    ngOnInit() {
        this.loadSettings();
    }

    async loadSettings() {
        this.loading.set(true);
        try {
            const res = await this.settingsService.getSettings();
            if (res.settings?.notifications) {
                this.notifications = { ...this.notifications, ...res.settings.notifications };
            }
            if (res.settings?.privacy) {
                this.privacy = { ...this.privacy, ...res.settings.privacy };
            }
        } catch { }
        // Load profile active state
        try {
            const profile = await this.profileService.fetchMyProfile();
            if (profile) {
                this.profileActive.set(profile.isActive !== false);
            }
        } catch { }
        this.loading.set(false);
    }

    async saveSettings() {
        this.saving.set(true);
        try {
            await this.settingsService.updateSettings({
                notifications: this.notifications,
                privacy: this.privacy
            });
            this.showMessage('Settings saved successfully!');
        } catch {
            this.showMessage('Failed to save settings.');
        }
        this.saving.set(false);
    }

    private showMessage(msg: string) {
        this.message.set(msg);
        setTimeout(() => this.message.set(''), 3000);
    }

    async toggleProfileActive() {
        this.togglingActive.set(true);
        try {
            const endpoint = this.profileActive() ? '/profiles/me/deactivate' : '/profiles/me/activate';
            const res: any = await this.api.put(endpoint, {});
            this.profileActive.set(res.isActive);
            this.showMessage(res.isActive ? 'Profile activated!' : 'Profile deactivated.');
        } catch {
            this.showMessage('Failed to update profile status.');
        }
        this.togglingActive.set(false);
    }
}
