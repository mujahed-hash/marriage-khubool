import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShortlistService } from '../../services/shortlist.service';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';

@Component({
    selector: 'app-shortlist',
    standalone: true,
    imports: [CommonModule, RouterModule, PhotoUrlPipe],
    templateUrl: './shortlist.html',
    styleUrl: './shortlist.css'
})
export class ShortlistComponent implements OnInit {
    profiles = signal<any[]>([]);
    loading = signal(true);
    private shortlistService = inject(ShortlistService);

    ngOnInit() {
        this.loadShortlist();
    }

    async loadShortlist() {
        this.loading.set(true);
        try {
            const res = await this.shortlistService.getShortlist();
            this.profiles.set(res.profiles || []);
        } catch {
            this.profiles.set([]);
        }
        this.loading.set(false);
    }

    async remove(profileId: string) {
        try {
            await this.shortlistService.removeFromShortlist(profileId);
            this.profiles.update(list => list.filter(p => p._id !== profileId));
        } catch { }
    }

    getPlaceholderImg(gender?: string): string {
        return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
    }
}
