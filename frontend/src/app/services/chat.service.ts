import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
    private api = inject(ApiService);
    private socket: Socket | null = null;

    messages = signal<any[]>([]);
    conversations = signal<any[]>([]);
    activeConversationId = signal<string | null>(null);
    typingUser = signal<string | null>(null);

    connect() {
        if (this.socket?.connected) return;
        const token = this.api.getToken();
        if (!token) return;

        const wsUrl = environment.apiUrl.replace('/api', '');
        this.socket = io(wsUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        this.socket.on('newMessage', (msg: any) => {
            if (msg.conversationId === this.activeConversationId()) {
                this.messages.update(list => [...list, msg]);
            }
            // Update conversation list last message
            this.conversations.update(list =>
                list.map(c => c._id === msg.conversationId
                    ? { ...c, lastMessage: msg.text, lastMessageAt: msg.createdAt }
                    : c
                )
            );
        });

        this.socket.on('userTyping', ({ userId }: any) => {
            this.typingUser.set(userId);
        });

        this.socket.on('userStoppedTyping', () => {
            this.typingUser.set(null);
        });
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    joinConversation(conversationId: string) {
        this.activeConversationId.set(conversationId);
        this.socket?.emit('joinConversation', conversationId);
    }

    sendMessage(conversationId: string, text: string) {
        this.socket?.emit('sendMessage', { conversationId, text });
    }

    emitTyping(conversationId: string) {
        this.socket?.emit('typing', { conversationId });
    }

    emitStopTyping(conversationId: string) {
        this.socket?.emit('stopTyping', { conversationId });
    }

    // REST endpoints
    async getConversations(): Promise<any> {
        return this.api.get('/chat/conversations');
    }

    async startConversation(profileId: string): Promise<any> {
        return this.api.post('/chat/conversations', { profileId });
    }

    async getMessages(conversationId: string, before?: string): Promise<{ messages: any[]; hasMore: boolean; nextCursor: string | null }> {
        const params: Record<string, string> = {};
        if (before) params['before'] = before;
        const res = await this.api.get<any>(`/chat/conversations/${conversationId}/messages`, Object.keys(params).length ? params : undefined);
        return { messages: res.messages || [], hasMore: res.hasMore ?? false, nextCursor: res.nextCursor ?? null };
    }
}
