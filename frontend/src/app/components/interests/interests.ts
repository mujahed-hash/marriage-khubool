import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InterestService } from '../../services/interest.service';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';

@Component({
    selector: 'app-interests',
    standalone: true,
    imports: [CommonModule, RouterModule, PhotoUrlPipe],
    templateUrl: './interests.html',
    styleUrl: './interests.css'
})
export class InterestsComponent implements OnInit {
    activeTab = signal<'sent' | 'received'>('sent');
    sentProfiles = signal<any[]>([]);
    receivedProfiles = signal<any[]>([]);
    loading = signal(true);
    actionMessage = signal('');
    private interestService = inject(InterestService);

    ngOnInit() {
        this.load();
    }

    setTab(tab: 'sent' | 'received') {
        this.activeTab.set(tab);
    }

    async load() {
        this.loading.set(true);
        try {
            const [sentRes, receivedRes] = await Promise.all([
                this.interestService.getSentInterests(),
                this.interestService.getReceivedInterests()
            ]);
            // Sent interests now come enriched with interestStatus
            const sent = (sentRes.interests || []).map((i: any) => ({
                ...i,
                _id: i._id || i.profileId,
            })).filter((p: any) => p && (p._id || p.profileId));

            // Received interests come with senderProfile + interestId + interestStatus
            const received = (receivedRes.interests || []).map((i: any) => ({
                ...(i.senderProfile || {}),
                interestId: i.interestId,
                interestStatus: i.interestStatus || 'pending',
                sentAt: i.sentAt
            })).filter((p: any) => p && (p._id || p.profileId || p.fullName));

            this.sentProfiles.set(sent);
            this.receivedProfiles.set(received);
        } catch {
            this.sentProfiles.set([]);
            this.receivedProfiles.set([]);
        }
        this.loading.set(false);
    }

    async acceptInterest(interestId: string) {
        try {
            await this.interestService.acceptInterest(interestId);
            // Update status locally
            this.receivedProfiles.update(list =>
                list.map(p => p.interestId === interestId ? { ...p, interestStatus: 'accepted' } : p)
            );
            this.showAction('Interest accepted!');
        } catch (e: any) {
            this.showAction(e.message || 'Failed to accept.');
        }
    }

    async rejectInterest(interestId: string) {
        try {
            await this.interestService.rejectInterest(interestId);
            this.receivedProfiles.update(list =>
                list.map(p => p.interestId === interestId ? { ...p, interestStatus: 'rejected' } : p)
            );
            this.showAction('Interest rejected.');
        } catch (e: any) {
            this.showAction(e.message || 'Failed to reject.');
        }
    }

    private showAction(msg: string) {
        this.actionMessage.set(msg);
        setTimeout(() => this.actionMessage.set(''), 3000);
    }

    getPlaceholderImg(gender?: string): string {
        return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
    }
}

