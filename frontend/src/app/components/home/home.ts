import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../services/profile';
import { MatchService } from '../../services/match.service';
import { AuthService } from '../../services/auth';
import { Profile } from '../../models/profile';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PhotoUrlPipe, InfiniteScrollDirective],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  diamondProfiles = signal<Partial<Profile>[]>([]);
  goldProfiles = signal<Partial<Profile>[]>([]);
  diamondIds = signal<string[]>([]);
  goldIds = signal<string[]>([]);
  matchScores = signal<Record<string, number | null>>({});

  diamondPage = 1;
  diamondLoading = false;
  diamondHasMore = true;

  goldPage = 1;
  goldLoading = false;
  goldHasMore = true;

  private profileService = inject(ProfileService);
  private matchService = inject(MatchService);
  private authService = inject(AuthService);

  get isGuest(): boolean {
    return !this.authService.isAuthenticated();
  }

  ngOnInit() {
    this.loadDiamondProfiles();
    this.loadGoldProfiles();
  }

  loadDiamondProfiles() {
    if (this.diamondLoading || !this.diamondHasMore) return;
    this.diamondLoading = true;
    this.profileService.getProfiles({ tier: 'diamond', limit: 8, page: this.diamondPage }).then(
      (res) => {
        const resAny = res as { profiles?: Partial<Profile>[]; profileIds?: string[] };
        if (this.isGuest && resAny.profileIds) {
          this.diamondIds.update(prev => [...prev, ...(resAny.profileIds || [])]);
          this.diamondHasMore = (resAny.profileIds || []).length === 8;
        } else {
          const list = res.profiles || [];
          this.diamondProfiles.update(prev => [...prev, ...list]);
          this.loadMatchScores(list);
          this.diamondHasMore = list.length === 8;
        }
        this.diamondLoading = false;
      },
      () => { this.diamondLoading = false; this.diamondHasMore = false; }
    );
  }

  loadGoldProfiles() {
    if (this.goldLoading || !this.goldHasMore) return;
    this.goldLoading = true;
    this.profileService.getProfiles({ tier: 'gold', limit: 8, page: this.goldPage }).then(
      (res) => {
        const resAny = res as { profiles?: Partial<Profile>[]; profileIds?: string[] };
        if (this.isGuest && resAny.profileIds) {
          this.goldIds.update(prev => [...prev, ...(resAny.profileIds || [])]);
          this.goldHasMore = (resAny.profileIds || []).length === 8;
        } else {
          const list = res.profiles || [];
          this.goldProfiles.update(prev => [...prev, ...list]);
          this.loadMatchScores(list);
          this.goldHasMore = list.length === 8;
        }
        this.goldLoading = false;
      },
      () => { this.goldLoading = false; this.goldHasMore = false; }
    );
  }

  getLoginRedirect(profileId: string): string {
    return `/login?redirect=${encodeURIComponent('/profile/' + profileId)}`;
  }

  onDiamondScroll() {
    if (!this.diamondLoading && this.diamondHasMore) {
      this.diamondPage++;
      this.loadDiamondProfiles();
    }
  }

  onGoldScroll() {
    if (!this.goldLoading && this.goldHasMore) {
      this.goldPage++;
      this.loadGoldProfiles();
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

  getPlaceholderImg(gender?: string): string {
    return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
  }
}
