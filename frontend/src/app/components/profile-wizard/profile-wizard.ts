import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile';
import { STATES_DISTRICTS } from '../../models/profile';

@Component({
    selector: 'app-profile-wizard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile-wizard.html',
    styleUrl: './profile-wizard.css'
})
export class ProfileWizardComponent {
    private profileService = inject(ProfileService);
    private router = inject(Router);

    profileData = this.profileService.profile;
    currentStep = this.profileService.step;

    // UI State
    imagePreview = signal<string | null>(null);
    isCompleted = signal<boolean>(false);
    isSaving = signal<boolean>(false);
    isEditMode = signal<boolean>(false);
    saveMessage = signal<string>('');

    profileStrength = computed(() => {
        const data = this.profileData();
        const fields = Object.keys(data).filter(k => (data as any)[k]);
        // Rough estimate of 25 total fields for a "full" profile
        const totalEstimatedFields = 25;
        return Math.min(Math.round((fields.length / totalEstimatedFields) * 100), 100);
    });

    states = Object.keys(STATES_DISTRICTS);
    districts: string[] = [];
    hobbiesString = '';

    stateLabels: { [key: string]: string } = {
        "AP": "Andhra Pradesh", "AR": "Arunachal Pradesh", "AS": "Assam", "BR": "Bihar",
        "CT": "Chhattisgarh", "GO": "Goa", "GJ": "Gujarat", "HR": "Haryana", "HP": "Himachal Pradesh",
        "JK": "Jammu & Kashmir", "JH": "Jharkhand", "KA": "Karnataka", "KL": "Kerala", "MP": "Madhya Pradesh",
        "MH": "Maharashtra", "MN": "Manipur", "ME": "Meghalaya", "MI": "Mizoram",
        "NL": "Nagaland",
        "TS": "Telangana", "TR": "Tripura", "UP": "Uttar Pradesh", "UT": "Uttarakhand", "WB": "West Bengal",
        "AN": "Andaman & Nicobar Islands", "CH": "Chandigarh", "DN": "Dadra & Nagar Haveli", "LD": "Lakshadweep", "PY": "Puducherry"
    };

    stepLabels = [
        { num: 1, title: 'Basic', icon: 'fa-user' },
        { num: 2, title: 'Religious', icon: 'fa-mosque' },
        { num: 3, title: 'Location', icon: 'fa-location-dot' },
        { num: 4, title: 'Education', icon: 'fa-graduation-cap' },
        { num: 5, title: 'Family', icon: 'fa-people-roof' },
        { num: 6, title: 'Lifestyle', icon: 'fa-utensils' },
        { num: 7, title: 'Media', icon: 'fa-camera' },
        { num: 8, title: 'Partner', icon: 'fa-heart' }
    ];

    constructor() {
        const data = this.profileData();
        if (data.state) this.onStateChange();
        if (data.hobbies && data.hobbies.length > 0) this.hobbiesString = data.hobbies.join(', ');
        if (data.profilePhotoUrl) this.imagePreview.set(data.profilePhotoUrl);

        this.profileService.fetchMyProfile().then((p) => {
            if (p && p.fullName) {
                this.isEditMode.set(true);
                // Ensure partnerPreferences exists with default arrays
                if (!p.partnerPreferences) {
                    p.partnerPreferences = {
                        ageRange: { min: 18, max: 40 },
                        maritalStatus: [], religion: [], motherTongue: [], diet: [], complexion: []
                    };
                }
                if (p.state) this.onStateChange();
                if (p.hobbies?.length) this.hobbiesString = p.hobbies.join(', ');
                if (p.profilePhotoUrl) this.imagePreview.set(p.profilePhotoUrl);
            } else {
                this.loadDummyData();
            }
        });
    }

    loadDummyData(): void {
        this.profileService.getSampleProfile().then((dummy) => {
            if (dummy && Object.keys(dummy).length > 0) {
                if (!dummy.partnerPreferences) {
                    dummy.partnerPreferences = {
                        ageRange: { min: 25, max: 30 },
                        maritalStatus: [], religion: [], motherTongue: [], diet: [], complexion: []
                    };
                }
                this.profileService.setProfile(dummy);
                const hobbies = (dummy as { hobbies?: string[] }).hobbies;
                this.hobbiesString = hobbies?.length ? hobbies.join(', ') : '';
                this.onStateChange();
            }
        });
    }

    getStepTitle(): string {
        const titles = [
            'Basic Details',
            'Religious & Cultural',
            'Location Details',
            'Education & Career',
            'Family Details',
            'Lifestyle & Interests',
            'Media & Verification',
            'Partner Preferences'
        ];
        return titles[this.currentStep() - 1];
    }

    onStateChange() {
        const state = this.profileData().state;
        if (state && STATES_DISTRICTS[state]) {
            this.districts = STATES_DISTRICTS[state];
        } else {
            this.districts = [];
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview.set(reader.result as string);
                // In a real app, we'd upload the file and get a URL
                this.profileService.updateProfile({ profilePhotoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    }

    isStepValid(form: any): boolean {
        // For now, simple validation based on 'required' attributes in the template
        return form.valid || false;
    }

    next() {
        this.profileService.nextStep();
        window.scrollTo(0, 0);
    }

    prev() {
        if (this.currentStep() <= 1) {
            this.router.navigate(['/']);
        } else {
            this.profileService.prevStep();
            window.scrollTo(0, 0);
        }
    }

    goToStep(step: number) {
        this.profileService.setStep(step);
        window.scrollTo(0, 0);
    }

    async saveProgress() {
        const hobbiesArray = this.hobbiesString
            ? this.hobbiesString.split(',').map(h => h.trim()).filter(h => h.length > 0)
            : [];
        this.profileService.updateProfile({ hobbies: hobbiesArray });

        this.isSaving.set(true);
        const ok = await this.profileService.saveProfile();
        this.isSaving.set(false);

        if (ok) {
            this.saveMessage.set('Progress saved!');
        } else {
            this.saveMessage.set('Failed to save. Try again.');
        }
        setTimeout(() => this.saveMessage.set(''), 3000);
    }

    async finish() {
        const hobbiesArray = this.hobbiesString
            ? this.hobbiesString.split(',').map(h => h.trim()).filter(h => h.length > 0)
            : [];
        this.profileService.updateProfile({ hobbies: hobbiesArray });

        this.isSaving.set(true);
        const ok = await this.profileService.saveProfile();
        this.isSaving.set(false);

        if (ok) {
            this.isCompleted.set(true);
            setTimeout(() => this.router.navigate(['/my-profile']), 2000);
        }
    }
}
