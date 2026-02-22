import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ProfileService } from '../../services/profile';
import { MatchService } from '../../services/match.service';
import { AuthService } from '../../services/auth';
import { Profile } from '../../models/profile';

@Component({
    selector: 'app-profile-list',
    standalone: true,
    imports: [CommonModule, RouterModule, PhotoUrlPipe],
    templateUrl: './profile-list.html',
    styleUrl: './profile-list.css'
})
export class ProfileListComponent implements OnInit {
    tier = '';
    profiles = signal<Partial<Profile>[]>([]);
    total = signal(0);
    page = signal(1);
    pages = signal(1);
    limit = 12;
    matchScores = signal<Record<string, number | null>>({});

    private route = inject(ActivatedRoute);
    private profileService = inject(ProfileService);
    private matchService = inject(MatchService);
    private authService = inject(AuthService);

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.tier = params['tier'] || 'gold';
            this.page.set(1);
            this.load();
        });
    }

    load() {
        if (!this.tier) return;
        this.profileService.getProfiles({
            tier: this.tier,
            page: this.page(),
            limit: this.limit
        }).then(res => {
            this.profiles.set(res.profiles || []);
            this.total.set(res.total ?? 0);
            this.pages.set(res.pages ?? 1);
            this.loadMatchScores(res.profiles || []);
        }, () => {});
    }

    private async loadMatchScores(profiles: Partial<Profile>[]) {
        if (!this.authService.isAuthenticated() || !profiles.length) return;
        try {
            const ids = profiles.map(p => p._id).filter(Boolean) as string[];
            if (ids.length === 0) return;
            const res = await this.matchService.getMatchScoresBatch(ids);
            this.matchScores.set(res.scores || {});
        } catch { }
    }

    getMatchScore(profileId: string): number | null {
        return this.matchScores()[profileId] ?? null;
    }

    goToPage(p: number) {
        if (p < 1 || p > this.pages()) return;
        this.page.set(p);
        this.load();
    }

    get tierTitle(): string {
        return this.tier.charAt(0).toUpperCase() + this.tier.slice(1) + ' Profiles';
    }

    get tierIcon(): string {
        const icons: Record<string, string> = {
            gold: 'fa-solid fa-trophy',
            diamond: 'fa-solid fa-gem',
            silver: 'fa-solid fa-medal',
            bronze: 'fa-solid fa-award',
            crown: 'fa-solid fa-gem'
        };
        return icons[this.tier] || 'fa-solid fa-user';
    }

    getPlaceholderImg(gender?: string): string {
        return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
    }
}
