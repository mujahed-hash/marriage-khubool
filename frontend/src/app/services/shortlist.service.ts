import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ShortlistService {
    private api = inject(ApiService);

    getShortlist(): Promise<any> {
        return this.api.get('/shortlist');
    }

    addToShortlist(profileId: string): Promise<any> {
        return this.api.post('/shortlist', { profileId });
    }

    removeFromShortlist(profileId: string): Promise<any> {
        return this.api.delete(`/shortlist/${profileId}`);
    }
}
