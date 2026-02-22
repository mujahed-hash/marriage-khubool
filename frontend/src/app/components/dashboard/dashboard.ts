import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProfileService } from '../../services/profile';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';
import { Profile } from '../../models/profile';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, PhotoUrlPipe],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
    showDeleteModal = signal(false);
    isDeleting = signal(false);
    deleteError = signal('');
    showRequirementsModal = signal(false);

    constructor(
        public profileService: ProfileService,
        private router: Router
    ) { }

    get profile(): Partial<Profile> {
        return this.profileService.profile();
    }

    ngOnInit() {
        this.profileService.fetchMyProfile();
    }

    openDeleteModal() {
        this.deleteError.set('');
        this.showDeleteModal.set(true);
    }

    closeDeleteModal() {
        this.showDeleteModal.set(false);
        this.deleteError.set('');
    }

    openRequirementsModal() {
        this.showRequirementsModal.set(true);
    }

    closeRequirementsModal() {
        this.showRequirementsModal.set(false);
    }

    async confirmDelete() {
        this.isDeleting.set(true);
        this.deleteError.set('');
        const ok = await this.profileService.deleteProfile();
        this.isDeleting.set(false);
        if (ok) {
            this.closeDeleteModal();
            this.router.navigate(['/create-profile']);
        } else {
            this.deleteError.set('Failed to delete profile. Please try again.');
        }
    }

    getPlaceholderImg(gender?: string): string {
        return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
    }
}
