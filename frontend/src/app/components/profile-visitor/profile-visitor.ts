import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VisitorService } from '../../services/visitor.service';

@Component({
    selector: 'app-profile-visitor',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './profile-visitor.html',
    styleUrl: './profile-visitor.css'
})
export class ProfileVisitorComponent implements OnInit {
    visitors = signal<any[]>([]);
    loading = signal(true);
    private visitorService = inject(VisitorService);

    ngOnInit() {
        this.loadVisitors();
    }

    async loadVisitors() {
        this.loading.set(true);
        try {
            const res = await this.visitorService.getMyVisitors();
            this.visitors.set(res.visitors || []);
        } catch {
            this.visitors.set([]);
        }
        this.loading.set(false);
    }

    getPlaceholderImg(gender?: string): string {
        return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
    }

    timeAgo(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    }
}
