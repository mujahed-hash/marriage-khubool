import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportService {
    private api = inject(ApiService);

    reportProfile(profileId: string, reason: string): Promise<any> {
        return this.api.post('/reports', { profileId, reason });
    }
}
