import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../services/profile';
import { MatchService } from '../../services/match.service';
import { AuthService } from '../../services/auth';
import { Profile } from '../../models/profile';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PhotoUrlPipe],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  diamondProfiles = signal<Partial<Profile>[]>([]);
  goldProfiles = signal<Partial<Profile>[]>([]);
  matchScores = signal<Record<string, number | null>>({});

  private profileService = inject(ProfileService);
  private matchService = inject(MatchService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.profileService.getProfiles({ tier: 'diamond', limit: 8 }).then(
      (res) => {
        this.diamondProfiles.set(res.profiles || []);
        this.loadMatchScores(res.profiles || []);
      },
      () => {}
    );
    this.profileService.getProfiles({ tier: 'gold', limit: 8 }).then(
      (res) => {
        this.goldProfiles.set(res.profiles || []);
        this.loadMatchScores(res.profiles || []);
      },
      () => {}
    );
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
