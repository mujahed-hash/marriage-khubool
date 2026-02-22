import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class VisitorService {
    private api = inject(ApiService);

    getMyVisitors(): Promise<any> {
        return this.api.get('/profiles/me/visitors');
    }

    recordVisit(profileId: string): Promise<any> {
        return this.api.post(`/profiles/${profileId}/view`, {});
    }
}
