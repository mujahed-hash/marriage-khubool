import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlatformStatus {
    maintenanceMode: boolean;
    maxPhotosPerUser: number;
}

@Injectable({ providedIn: 'root' })
export class PlatformService {
    private base = `${environment.apiUrl}/platform`;
    private cached: PlatformStatus | null = null;
    private lastFetch = 0;
    private TTL = 60_000; // 1 min

    constructor(private http: HttpClient) {}

    async getStatus(): Promise<PlatformStatus> {
        if (this.cached && Date.now() - this.lastFetch < this.TTL) {
            return this.cached;
        }
        try {
            const s = await firstValueFrom(this.http.get<PlatformStatus>(`${this.base}/status`));
            this.cached = s;
            this.lastFetch = Date.now();
            return s;
        } catch {
            return { maintenanceMode: false, maxPhotosPerUser: 10 };
        }
    }

    clearCache() { this.cached = null; }
}
