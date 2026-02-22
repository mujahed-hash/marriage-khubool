import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class InterestService {
    private api = inject(ApiService);

    sendInterest(profileId: string): Promise<any> {
        return this.api.post(`/interest/${profileId}`, {});
    }

    getSentInterests(): Promise<any> {
        return this.api.get('/interest/sent');
    }

    getReceivedInterests(): Promise<any> {
        return this.api.get('/interest/received');
    }

    acceptInterest(interestId: string): Promise<any> {
        return this.api.put(`/interest/${interestId}/accept`, {});
    }

    rejectInterest(interestId: string): Promise<any> {
        return this.api.put(`/interest/${interestId}/reject`, {});
    }
}
