import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile';
import { Profile } from '../../models/profile';
import { STATES_DISTRICTS } from '../../models/profile';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, PhotoUrlPipe],
    templateUrl: './search.html',
    styleUrl: './search.css'
})
export class SearchComponent implements OnInit {
    searchQuery = '';
    filterState = '';
    filterGender = '';
    hasSearched = false;
    results = signal<Partial<Profile>[]>([]);

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

    constructor(
        private profileService: ProfileService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.searchQuery = params['q'] || '';
            this.filterState = params['state'] || '';
            this.filterGender = params['gender'] || '';
            this.runSearch();
        });
    }

    onSearch(): void {
        this.hasSearched = true;
        this.runSearch();
    }

    private runSearch(): void {
        const q = this.searchQuery.trim();
        if (!q && !this.filterState && !this.filterGender) {
            if (this.hasSearched) this.results.set([]);
            return;
        }
        this.hasSearched = true;
        this.results.set([]);
        const params: { search?: string; state?: string; gender?: string } = {};
        if (q) params.search = q;
        if (this.filterState) params.state = this.filterState;
        if (this.filterGender) params.gender = this.filterGender;
        this.profileService.getProfiles(params).then(
            res => this.results.set(res.profiles),
            () => this.results.set([])
        );
    }

    getPlaceholderImg(gender?: string): string {
        return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
    }
}
