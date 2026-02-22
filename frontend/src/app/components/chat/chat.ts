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
    messages = signal<any[]>([]);
    loading = signal(true);
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

        // Load messages
        try {
            const res = await this.chatService.getMessages(conv._id);
            this.messages.set(res.messages || []);
            this.chatService.messages.set(res.messages || []);
        } catch {
            this.messages.set([]);
        }

        this.scrollToBottom();

        // Subscribe to new messages reactively
        this.chatService.messages.set(this.messages());
    }

    sendMessage() {
        if (!this.newMessage.trim() || !this.activeConversation()) return;

        const convId = this.activeConversation()._id;
        this.chatService.sendMessage(convId, this.newMessage.trim());

        // Optimistically add message
        this.messages.update(list => [...list, {
            senderId: this.currentUserId,
            text: this.newMessage.trim(),
            createdAt: new Date().toISOString(),
            _id: 'temp_' + Date.now()
        }]);

        this.newMessage = '';
        this.chatService.emitStopTyping(convId);
        this.scrollToBottom();
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
