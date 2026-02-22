import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BlockService {
    private api = inject(ApiService);

    getBlockedProfiles(): Promise<any> {
        return this.api.get('/block');
    }

    blockProfile(profileId: string): Promise<any> {
        return this.api.post(`/block/${profileId}`, {});
    }

    unblockProfile(profileId: string): Promise<any> {
        return this.api.delete(`/block/${profileId}`);
    }

    isBlocked(profileId: string): Promise<any> {
        return this.api.get(`/block/check/${profileId}`);
    }
}
