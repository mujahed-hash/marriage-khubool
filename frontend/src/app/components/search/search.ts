import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile';
import { AuthService } from '../../services/auth';
import { Profile } from '../../models/profile';
import { STATES_DISTRICTS } from '../../models/profile';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, PhotoUrlPipe, InfiniteScrollDirective],
    templateUrl: './search.html',
    styleUrl: './search.css'
})
export class SearchComponent implements OnInit {
    searchQuery = '';
    filterState = '';
    filterGender = '';
    hasSearched = false;
    results = signal<Partial<Profile>[]>([]);
    resultIds = signal<string[]>([]);

    currentPage = 1;
    isLoading = false;
    hasMore = true;

    private route = inject(ActivatedRoute);
    private profileService = inject(ProfileService);
    private authService = inject(AuthService);

    get isGuest(): boolean {
        return !this.authService.isAuthenticated();
    }

    states = Object.keys(STATES_DISTRICTS);
    stateLabels: Record<string, string> = {
        AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh', AS: 'Assam', BR: 'Bihar',
        CT: 'Chhattisgarh', GO: 'Goa', GJ: 'Gujarat', HR: 'Haryana', HP: 'Himachal Pradesh',
        JK: 'Jammu & Kashmir', JH: 'Jharkhand', KA: 'Karnataka', KL: 'Kerala', MP: 'Madhya Pradesh',
        MH: 'Maharashtra', MN: 'Manipur', ME: 'Meghalaya', MI: 'Mizoram', NL: 'Nagaland',
        OD: 'Odisha', PB: 'Punjab', RJ: 'Rajasthan', SK: 'Sikkim', TN: 'Tamil Nadu',
        TS: 'Telangana', TR: 'Tripura', UP: 'Uttar Pradesh', UT: 'Uttarakhand', WB: 'West Bengal',
        AN: 'Andaman & Nicobar', CH: 'Chandigarh', DN: 'Dadra & Nagar Haveli', LD: 'Lakshadweep', PY: 'Puducherry'
    };

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.searchQuery = params['q'] || '';
            this.filterState = params['state'] || '';
            this.filterGender = params['gender'] || '';
            this.resetAndSearch();
        });
    }

    onSearch(): void {
        this.resetAndSearch();
    }

    resetAndSearch(): void {
        this.currentPage = 1;
        this.hasMore = true;
        this.results.set([]);
        this.resultIds.set([]);
        this.hasSearched = true;
        this.loadProfiles();
    }

    onScrollLoadMore(): void {
        if (!this.isLoading && this.hasMore) {
            this.currentPage++;
            this.loadProfiles();
        }
    }

    private loadProfiles(): void {
        const q = this.searchQuery.trim();
        if (!q && !this.filterState && !this.filterGender) {
            if (this.hasSearched) this.results.set([]);
            return;
        }

        this.isLoading = true;
        const params: { search?: string; state?: string; gender?: string; page?: number; limit?: number } = {};
        if (q) params.search = q;
        if (this.filterState) params.state = this.filterState;
        if (this.filterGender) params.gender = this.filterGender;
        params.page = this.currentPage;
        params.limit = 20;

        this.profileService.getProfiles(params).then(
            res => {
                const resAny = res as { profiles?: Partial<Profile>[]; profileIds?: string[] };
                if (this.isGuest && resAny.profileIds) {
                    this.resultIds.update(prev => [...prev, ...(resAny.profileIds || [])]);
                    this.hasMore = (resAny.profileIds || []).length === params.limit;
                } else {
                    const list = res.profiles || [];
                    this.results.update(prev => [...prev, ...list]);
                    this.hasMore = list.length === params.limit;
                }
                this.isLoading = false;
            },
            () => {
                this.isLoading = false;
                this.hasMore = false;
            }
        );
    }

    getPlaceholderImg(gender?: string): string {
        return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
    }

    getLoginRedirect(profileId: string): string {
        return `/login?redirect=${encodeURIComponent('/profile/' + profileId)}`;
    }

    /** Safe tier class for View Profile button - handles undefined, null, case */
    getTierViewClass(tier?: string | null): string {
        const t = (tier || 'bronze').toString().toLowerCase();
        if (['diamond', 'gold', 'silver', 'bronze', 'crown'].includes(t)) return `${t}-view-profile`;
        return 'bronze-view-profile';
    }
}
