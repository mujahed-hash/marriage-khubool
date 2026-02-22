import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private api = inject(ApiService);

    getNotifications(): Promise<{ notifications: any[]; unreadCount: number }> {
        return this.api.get('/notifications');
    }

    markAsRead(id: string): Promise<any> {
        return this.api.put(`/notifications/${id}/read`, {});
    }

    markAllAsRead(): Promise<any> {
        return this.api.put('/notifications/read-all', {});
    }
}
