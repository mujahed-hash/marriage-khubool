import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../services/profile';

const DEFAULT_PREFS = {
    ageRange: { min: 18, max: 40 },
    heightRange: { min: '', max: '' },
    maritalStatus: [] as string[],
    religion: [] as string[],
    motherTongue: [] as string[],
    diet: [] as string[],
    country: [] as string[],
    state: [] as string[],
    city: '',
    complexion: [] as string[],
    annualIncome: ''
};

@Component({
    selector: 'app-my-requirements',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './my-requirements.html',
    styleUrl: './my-requirements.css'
})
export class MyRequirementsComponent implements OnInit {
    loading = signal(true);
    saving = signal(false);
    message = signal('');
    editing = signal(false);
    savedPrefs = signal<typeof DEFAULT_PREFS | null>(null);

    prefs = { ...JSON.parse(JSON.stringify(DEFAULT_PREFS)) };

    private profileService = inject(ProfileService);

    ngOnInit() {
        this.loadRequirements();
    }

    async loadRequirements() {
        this.loading.set(true);
        this.editing.set(false);
        try {
            const profile = await this.profileService.fetchMyProfile();
            if (profile?.partnerPreferences) {
                const merged = { ...DEFAULT_PREFS, ...profile.partnerPreferences };
                this.prefs = { ...JSON.parse(JSON.stringify(merged)) };
                this.savedPrefs.set({ ...JSON.parse(JSON.stringify(merged)) });
            } else {
                this.prefs = { ...JSON.parse(JSON.stringify(DEFAULT_PREFS)) };
                this.savedPrefs.set(null);
            }
        } catch {
            this.savedPrefs.set(null);
        }
        this.loading.set(false);
    }

    startEditing() {
        this.editing.set(true);
    }

    cancelEditing() {
        const saved = this.savedPrefs();
        if (saved) {
            this.prefs = { ...JSON.parse(JSON.stringify(saved)) };
        } else {
            this.prefs = { ...JSON.parse(JSON.stringify(DEFAULT_PREFS)) };
        }
        this.editing.set(false);
    }

    async saveRequirements() {
        this.saving.set(true);
        try {
            this.profileService.updateProfile({ partnerPreferences: this.prefs });
            const ok = await this.profileService.saveProfile();
            if (ok) {
                this.savedPrefs.set({ ...JSON.parse(JSON.stringify(this.prefs)) });
                this.editing.set(false);
                this.showMessage('Requirements saved!');
            } else {
                this.showMessage('Failed to save requirements.');
            }
        } catch {
            this.showMessage('Failed to save requirements.');
        }
        this.saving.set(false);
    }

    get hasRequirements(): boolean {
        return this.savedPrefs() != null;
    }

    get showForm(): boolean {
        return !this.hasRequirements || this.editing();
    }

    toggleItem(list: string[], value: string) {
        const idx = list.indexOf(value);
        if (idx > -1) {
            list.splice(idx, 1);
        } else {
            list.push(value);
        }
    }

    isSelected(list: string[], value: string): boolean {
        return list.includes(value);
    }

    private showMessage(msg: string) {
        this.message.set(msg);
        setTimeout(() => this.message.set(''), 3000);
    }
}
