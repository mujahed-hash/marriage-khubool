import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../services/profile';
import { Profile } from '../../models/profile';

@Component({
    selector: 'app-right-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule, PhotoUrlPipe],
    templateUrl: './right-sidebar.html',
    styleUrl: './right-sidebar.css'
})
export class RightSidebarComponent implements OnInit {
    suggestions = signal<Partial<Profile>[]>([]);

    constructor(private profileService: ProfileService) {}

    ngOnInit() {
        this.profileService.getProfiles({ limit: 3 }).then(
            res => this.suggestions.set(res.profiles),
            () => {}
        );
    }

    getPlaceholderImg(gender?: string): string {
        return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
    }

    getTierClass(tier?: string): string {
        return tier ? `tier-${tier}` : 'tier-bronze';
    }

    getTierCardClass(tier?: string): string {
        const t = (tier || 'bronze').toLowerCase();
        if (['diamond', 'gold', 'silver', 'crown'].includes(t)) return `${t}-card`;
        return 'bronze-card';
    }

    getTierOverlayClass(tier?: string): string {
        const t = (tier || 'bronze').toLowerCase();
        if (['diamond', 'gold', 'silver', 'crown'].includes(t)) return `${t}-overlay`;
        return 'bronze-overlay';
    }

    getTierViewClass(tier?: string): string {
        const t = (tier || 'bronze').toLowerCase();
        if (['diamond', 'gold', 'silver', 'crown'].includes(t)) return `${t}-view-profile`;
        return 'bronze-view-profile';
    }
}
