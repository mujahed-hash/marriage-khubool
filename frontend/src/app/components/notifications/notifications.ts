import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './notifications.html',
    styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {
    notifications = signal<any[]>([]);
    unreadCount = signal(0);
    loading = signal(true);
    private notificationService = inject(NotificationService);

    ngOnInit() {
        this.load();
    }

    async load() {
        this.loading.set(true);
        try {
            const res = await this.notificationService.getNotifications();
            this.notifications.set(res.notifications || []);
            this.unreadCount.set(res.unreadCount || 0);
        } catch {
            this.notifications.set([]);
        }
        this.loading.set(false);
    }

    async markAsRead(id: string) {
        try {
            await this.notificationService.markAsRead(id);
            this.notifications.update(list =>
                list.map(n => n._id === id ? { ...n, read: true } : n)
            );
            this.unreadCount.update(c => Math.max(0, c - 1));
        } catch { }
    }

    async markAllAsRead() {
        try {
            await this.notificationService.markAllAsRead();
            this.notifications.update(list => list.map(n => ({ ...n, read: true })));
            this.unreadCount.set(0);
        } catch { }
    }

    getIcon(type: string): string {
        const icons: Record<string, string> = {
            interest_received: 'fa-heart',
            interest_accepted: 'fa-heart-circle-check',
            profile_visited: 'fa-eye',
            message_received: 'fa-comments'
        };
        return icons[type] || 'fa-bell';
    }

    timeAgo(date: string): string {
        const d = new Date(date);
        const now = new Date();
        const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (sec < 60) return 'Just now';
        if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
        if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
        if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
        return d.toLocaleDateString();
    }
}
