import { Component, OnInit, OnDestroy, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { PhotoUrlPipe } from '../../pipes/photo-url.pipe';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, PhotoUrlPipe],
    templateUrl: './chat.html',
    styleUrl: './chat.css'
})
export class ChatComponent implements OnInit, OnDestroy {
    chatService = inject(ChatService);
    conversations = signal<any[]>([]);
    activeConversation = signal<any | null>(null);
    loading = signal(true);
    loadingOlder = signal(false);
    hasMoreOlder = signal(true);
    nextCursor = signal<string | null>(null);
    newMessage = '';
    currentUserId = '';

    @ViewChild('messagesContainer') messagesContainer!: ElementRef;

    ngOnInit() {
        // Get current user id from localStorage
        try {
            const user = JSON.parse(localStorage.getItem('khubool_user') || '{}');
            this.currentUserId = user._id || user.id || '';
        } catch { }

        this.chatService.connect();
        this.loadConversations();
    }

    ngOnDestroy() {
        // Don't disconnect — keep the socket alive for notifications
    }

    async loadConversations() {
        this.loading.set(true);
        try {
            const res = await this.chatService.getConversations();
            this.conversations.set(res.conversations || []);
        } catch {
            this.conversations.set([]);
        }
        this.loading.set(false);
    }

    async selectConversation(conv: any) {
        this.activeConversation.set(conv);
        this.chatService.joinConversation(conv._id);
        this.hasMoreOlder.set(true);
        this.nextCursor.set(null);

        try {
            const res = await this.chatService.getMessages(conv._id);
            const msgs = res.messages || [];
            this.chatService.messages.set(msgs);
            this.hasMoreOlder.set(res.hasMore);
            this.nextCursor.set(res.nextCursor);
        } catch {
            this.chatService.messages.set([]);
        }

        this.scrollToBottom();
    }

    sendMessage() {
        if (!this.newMessage.trim() || !this.activeConversation()) return;

        const convId = this.activeConversation()._id;
        this.chatService.sendMessage(convId, this.newMessage.trim());

        // Optimistically add message
        this.chatService.messages.update(list => [...list, {
            senderId: this.currentUserId,
            text: this.newMessage.trim(),
            createdAt: new Date().toISOString(),
            _id: 'temp_' + Date.now()
        }]);

        this.newMessage = '';
        this.chatService.emitStopTyping(convId);
        this.scrollToBottom();
    }

    async onMessagesScroll() {
        const el = this.messagesContainer?.nativeElement as HTMLElement;
        if (!el || this.loadingOlder() || !this.hasMoreOlder() || !this.activeConversation()) return;
        if (el.scrollTop > 100) return;
        const cursor = this.nextCursor();
        if (!cursor) return;

        this.loadingOlder.set(true);
        try {
            const res = await this.chatService.getMessages(this.activeConversation()._id, cursor);
            const older = res.messages || [];
            if (older.length) {
                const prevHeight = el.scrollHeight;
                this.chatService.messages.update(list => [...older, ...list]);
                this.hasMoreOlder.set(res.hasMore);
                this.nextCursor.set(res.nextCursor);
                setTimeout(() => {
                    el.scrollTop = el.scrollHeight - prevHeight;
                }, 0);
            } else {
                this.hasMoreOlder.set(false);
            }
        } catch { }
        this.loadingOlder.set(false);
    }

    onTyping() {
        if (this.activeConversation()) {
            this.chatService.emitTyping(this.activeConversation()._id);
        }
    }

    private scrollToBottom() {
        setTimeout(() => {
            const el = this.messagesContainer?.nativeElement;
            if (el) el.scrollTop = el.scrollHeight;
        }, 50);
    }

    getTimeAgo(dateStr: string): string {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        return `${days}d`;
    }

    getPlaceholderImg(gender?: string): string {
        return gender === 'female' ? 'assets/bride.png' : 'assets/groom.png';
    }
}
