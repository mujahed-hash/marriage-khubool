import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile';
import { ShortlistService } from '../../services/shortlist.service';
import { InterestService } from '../../services/interest.service';
import { ReportService } from '../../services/report.service';
import { VisitorService } from '../../services/visitor.service';
import { MatchService } from '../../services/match.service';
import { BlockService } from '../../services/block.service';
import { ChatService } from '../../services/chat.service';
import { Profile } from '../../models/profile';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, PhotoUrlPipe],
    templateUrl: './user-profile.html',
    styleUrl: './user-profile.css'
})
export class UserProfileComponent implements OnInit {
    profileId = signal<string | null>(null);
    profile = signal<Partial<Profile> | null>(null);
    loading = signal(true);
    matchScore = signal<number | null>(null);

    // Action state signals
    shortlisted = signal(false);
    interestSent = signal(false);
    isBlocked = signal(false);
    actionMessage = signal('');

    // Report modal
    showReportModal = signal(false);
    reportReason = '';

    // Requirements modal
    showRequirementsModal = signal(false);

    // Match breakdown modal
    showMatchBreakdownModal = signal(false);
    matchBreakdown = signal<{ matchScore: number; breakdown: { label: string; matched: boolean; yourPreference: string | null; theirValue: string | null }[] } | null>(null);

    private route = inject(ActivatedRoute);
    private profileService = inject(ProfileService);
    private shortlistService = inject(ShortlistService);
    private interestService = inject(InterestService);
    private reportService = inject(ReportService);
    private visitorService = inject(VisitorService);
    private matchService = inject(MatchService);
    private blockService = inject(BlockService);
    private chatService = inject(ChatService);
    private router = inject(Router);

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            this.profileId.set(id);
            this.loading.set(true);

            // Reset action state for each new profile
            this.shortlisted.set(false);
            this.interestSent.set(false);
            this.isBlocked.set(false);
            this.actionMessage.set('');
            this.showReportModal.set(false);

            if (id) {
                this.profileService.getProfileById(id).then(async (p) => {
                    // Redirect to /my-profile if the user is viewing their own profile
                    const currentUser = JSON.parse(localStorage.getItem('khubool_user') || '{}');
                    const myUserId = String(currentUser._id || currentUser.id || '');
                    const profileUserId = p ? String((p as any).userId?._id ?? (p as any).userId ?? '') : '';
                    if (p && profileUserId && myUserId && profileUserId === myUserId) {
                        this.router.navigate(['/my-profile']);
                        return;
                    }
                    this.profile.set(p ?? null);
                    this.visitorService.recordVisit(id).catch(() => { });
                    const apiId = this.profileService.getProfileIdForApi(p ?? null, id);
                    if (apiId) {
                        await this.checkExistingState(apiId);
                        this.loadMatchScore(apiId).catch(() => { });
                    }
                    this.loading.set(false);
                }).catch(() => this.loading.set(false));
            } else {
                this.loading.set(false);
            }
        });
    }

    private async loadMatchScore(profileId: string) {
        try {
            const res = await this.matchService.getMatchScore(profileId);
            this.matchScore.set(res.matchScore ?? null);
        } catch {
            this.matchScore.set(null);
        }
    }

    /** Check if the logged-in user has already shortlisted/sent interest/blocked this profile */
    private async checkExistingState(profileId: string) {
        try {
            const res = await this.profileService.getProfileActions(profileId);
            this.shortlisted.set(res.shortlisted);
            this.interestSent.set(res.interestSent);
            this.isBlocked.set(res.blocked);
        } catch {
            this.shortlisted.set(false);
            this.interestSent.set(false);
            this.isBlocked.set(false);
        }
    }


    getPlaceholderImg(gender?: string): string {
        return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
    }

    async sendInterest() {
        const apiId = this.profileService.getProfileIdForApi(this.profile(), this.profileId());
        if (!apiId) return;
        try {
            await this.interestService.sendInterest(apiId);
            this.interestSent.set(true);
            this.showAction('Interest sent!');
        } catch (e: any) {
            this.showAction(e.message || 'Failed to send interest.');
        }
    }

    async toggleShortlist() {
        const apiId = this.profileService.getProfileIdForApi(this.profile(), this.profileId());
        if (!apiId) return;
        try {
            if (this.shortlisted()) {
                await this.shortlistService.removeFromShortlist(apiId);
                this.shortlisted.set(false);
                this.showAction('Removed from shortlist.');
            } else {
                await this.shortlistService.addToShortlist(apiId);
                this.shortlisted.set(true);
                this.showAction('Profile shortlisted!');
            }
        } catch (e: any) {
            this.showAction(e.message || 'Shortlist action failed.');
        }
    }

    openReportModal() {
        this.showReportModal.set(true);
        this.reportReason = '';
    }

    async submitReport() {
        const apiId = this.profileService.getProfileIdForApi(this.profile(), this.profileId());
        if (!apiId || !this.reportReason.trim()) return;
        try {
            await this.reportService.reportProfile(apiId, this.reportReason.trim());
            this.showReportModal.set(false);
            this.showAction('Report submitted. Thank you.');
        } catch (e: any) {
            this.showAction(e.message || 'Failed to submit report.');
        }
    }

    private showAction(msg: string) {
        this.actionMessage.set(msg);
        setTimeout(() => this.actionMessage.set(''), 3000);
    }

    async onChatClick() {
        const apiId = this.profileService.getProfileIdForApi(this.profile(), this.profileId());
        if (!apiId) return;
        try {
            const res = await this.chatService.startConversation(apiId);
            this.router.navigate(['/chat']);
        } catch (e: any) {
            this.showAction(e.message || 'Failed to start chat.');
        }
    }

    async toggleBlock() {
        const apiId = this.profileService.getProfileIdForApi(this.profile(), this.profileId());
        if (!apiId) return;
        try {
            if (this.isBlocked()) {
                await this.blockService.unblockProfile(apiId);
                this.isBlocked.set(false);
                this.showAction('Profile unblocked.');
            } else {
                await this.blockService.blockProfile(apiId);
                this.isBlocked.set(true);
                this.showAction('Profile blocked.');
            }
        } catch (e: any) {
            this.showAction(e.message || 'Block action failed.');
        }
    }

    scrollToPhotos() {
        document.getElementById('profile-photos')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    scrollToBiodata() {
        document.getElementById('biodata')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async openMatchBreakdown() {
        const apiId = this.profileService.getProfileIdForApi(this.profile(), this.profileId());
        if (!apiId) return;
        try {
            const res = await this.matchService.getMatchScoreWithBreakdown(apiId);
            if (res.matchScore != null && res.breakdown?.length) {
                this.matchBreakdown.set({ matchScore: res.matchScore, breakdown: res.breakdown });
                this.showMatchBreakdownModal.set(true);
            } else if (res.matchScore != null) {
                this.matchBreakdown.set({ matchScore: res.matchScore, breakdown: [] });
                this.showMatchBreakdownModal.set(true);
            }
        } catch { }
    }
}
