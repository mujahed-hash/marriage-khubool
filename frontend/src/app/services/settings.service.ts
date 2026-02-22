import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
    private api = inject(ApiService);

    getSettings(): Promise<any> {
        return this.api.get('/settings');
    }

    updateSettings(data: { notifications?: any; privacy?: any }): Promise<any> {
        return this.api.put('/settings', data);
    }
}
