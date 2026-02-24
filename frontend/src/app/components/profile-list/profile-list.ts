import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ProfileService } from '../../services/profile';
import { MatchService } from '../../services/match.service';
import { AuthService } from '../../services/auth';
import { Profile } from '../../models/profile';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';

@Component({
    selector: 'app-profile-list',
    standalone: true,
    imports: [CommonModule, RouterModule, PhotoUrlPipe, InfiniteScrollDirective],
    templateUrl: './profile-list.html',
    styleUrl: './profile-list.css'
})
export class ProfileListComponent implements OnInit {
    tier = '';
    profiles = signal<Partial<Profile>[]>([]);
    profileIds = signal<string[]>([]);
    total = signal(0);
    limit = 12;
    currentPage = 1;
    isLoading = false;
    hasMore = true;
    matchScores = signal<Record<string, number | null>>({});

    private route = inject(ActivatedRoute);
    private profileService = inject(ProfileService);
    private matchService = inject(MatchService);
    private authService = inject(AuthService);

    get isGuest(): boolean {
        return !this.authService.isAuthenticated();
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.tier = params['tier'] || 'gold';
            this.resetAndLoad();
        });
    }

    resetAndLoad() {
        this.currentPage = 1;
        this.hasMore = true;
        this.profiles.set([]);
        this.profileIds.set([]);
        this.load();
    }

    load() {
        if (!this.tier) return;
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;
        this.profileService.getProfiles({
            tier: this.tier,
            page: this.currentPage,
            limit: this.limit
        }).then(res => {
            const resAny = res as { profiles?: Partial<Profile>[]; profileIds?: string[]; total?: number };
            if (this.isGuest && resAny.profileIds) {
                this.profileIds.update(prev => [...prev, ...(resAny.profileIds || [])]);
            } else {
                const list = res.profiles || [];
                this.profiles.update(prev => [...prev, ...list]);
                this.loadMatchScores(list);
            }
            this.total.set(res.total ?? 0);
            const count = (resAny.profileIds || res.profiles || []).length;
            this.hasMore = count === this.limit;
            this.isLoading = false;
        }, () => {
            this.isLoading = false;
            this.hasMore = false;
        });
    }

    onScrollLoadMore() {
        if (!this.isLoading && this.hasMore) {
            this.currentPage++;
            this.load();
        }
    }

    private async loadMatchScores(profiles: Partial<Profile>[]) {
        if (!this.authService.isAuthenticated() || !profiles.length) return;
        try {
            const ids = profiles.map(p => p._id).filter(Boolean) as string[];
            if (ids.length === 0) return;
            const res = await this.matchService.getMatchScoresBatch(ids);
            this.matchScores.update(prev => ({ ...prev, ...res.scores }));
        } catch { }
    }

    getMatchScore(profileId: string): number | null {
        return this.matchScores()[profileId] ?? null;
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

    getLoginRedirect(profileId: string): string {
        return `/login?redirect=${encodeURIComponent('/profile/' + profileId)}`;
    }
}
