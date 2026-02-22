import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface MatchBreakdownItem {
    label: string;
    matched: boolean;
    yourPreference: string | null;
    theirValue: string | null;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
    private api = inject(ApiService);

    getMatchScore(profileId: string): Promise<{ matchScore: number | null }> {
        return this.api.get(`/match/${profileId}`);
    }

    getMatchScoreWithBreakdown(profileId: string): Promise<{ matchScore: number | null; breakdown: MatchBreakdownItem[] | null }> {
        return this.api.get(`/match/${profileId}?breakdown=true`);
    }

    getMatchScoresBatch(profileIds: string[]): Promise<{ scores: Record<string, number | null> }> {
        return this.api.post('/match/batch', { profileIds });
    }
}
