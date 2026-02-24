import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api';

@Component({
    selector: 'app-conversations',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="conv-page">
    <div class="conv-container">
        <!-- Sidebar: Conversation List -->
        <div class="conv-list-panel">
            <div class="panel-header">
                <h3>Conversations</h3>
                <div class="search-box">
                    <input type="text" [(ngModel)]="userIdFilter" (ngModelChange)="loadConversations()" placeholder="Filter by User ID..." class="input-search">
                </div>
            </div>
            
            <div class="list-scroll">
                @if (loadingConversations()) {
                    <div class="loading-state">Loading...</div>
                } @else {
                    @for (c of conversations(); track c._id) {
                        <div class="conv-item" [class.active]="selectedId() === c._id" (click)="selectConversation(c)">
                            <div class="participants">
                                <div class="p-names">{{ c.participants[0]?.fullName }} & {{ c.participants[1]?.fullName }}</div>
                                <div class="p-emails">{{ c.participants[0]?.email }} / {{ c.participants[1]?.email }}</div>
                            </div>
                            <div class="last-meta">
                                <span class="last-time">{{ c.lastMessageAt | date:'short' }}</span>
                                <span class="msg-preview">{{ c.lastMessage }}</span>
                            </div>
                        </div>
                    } @empty {
                        <div class="empty-state">No conversations found.</div>
                    }
                }
            </div>

            <div class="list-footer">
                <button [disabled]="page() <= 1" (click)="prevPage()">←</button>
                <span>{{ page() }} / {{ pages() }}</span>
                <button [disabled]="page() >= pages()" (click)="nextPage()">→</button>
            </div>
        </div>

        <!-- Main Workspace: Message Viewer -->
        <div class="conv-viewer-panel">
            @if (selectedConv()) {
                <div class="viewer-header">
                    <div class="chat-title">
                        <h4>Audit: {{ selectedConv().participants[0]?.fullName }} & {{ selectedConv().participants[1]?.fullName }}</h4>
                        <span class="audit-warning">⚠️ All views are logged for audit purposes.</span>
                    </div>
                </div>

                <div class="message-list" #msgList>
                    @if (loadingMessages()) {
                        <div class="loading-state">Loading messages...</div>
                    } @else {
                        @for (m of messages(); track m._id) {
                            <div class="msg-row" [class.sent]="m.senderId === selectedConv().participants[0]?._id">
                                <div class="msg-bubble">
                                    <div class="msg-sender">{{ getSenderName(m.senderId) }}</div>
                                    <div class="msg-text">{{ m.text }}</div>
                                    <div class="msg-time">{{ m.createdAt | date:'shortTime' }}</div>
                                </div>
                            </div>
                        } @empty {
                            <div class="empty-state">No messages in this conversation.</div>
                        }
                    }
                </div>
            } @else {
                <div class="no-selection">
                    <div class="placeholder-icon">💬</div>
                    <h3>Select a conversation to audit</h3>
                    <p>Message history will be retrieved securely from the backend.</p>
                </div>
            }
        </div>
    </div>
</div>`,
    styles: [`
.conv-page { height: calc(100vh - 120px); }
.conv-container { display: flex; height: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; }

/* List Panel */
.conv-list-panel { width: 350px; display: flex; flex-direction: column; border-right: 1px solid #334155; background: #0f172a; }
.panel-header { padding: 1.25rem; border-bottom: 1px solid #334155; }
.panel-header h3 { margin: 0 0 1rem; color: #f1f5f9; font-size: 1.1rem; }
.input-search { width: 100%; padding: 0.5rem 0.75rem; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #f1f5f9; font-size: 0.85rem; }

.list-scroll { flex: 1; overflow-y: auto; }
.conv-item { padding: 1rem 1.25rem; border-bottom: 1px solid #1e293b; cursor: pointer; transition: all 0.2s; }
.conv-item:hover { background: #1e293b; }
.conv-item.active { background: #334155; border-left: 4px solid #6366f1; }

.participants { margin-bottom: 0.5rem; }
.p-names { color: #f1f5f9; font-weight: 600; font-size: 0.9rem; }
.p-emails { color: #64748b; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.last-meta { display: flex; flex-direction: column; gap: 0.2rem; }
.last-time { color: #475569; font-size: 0.7rem; }
.msg-preview { color: #94a3b8; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.list-footer { padding: 0.75rem; border-top: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; color: #94a3b8; font-size: 0.8rem; }
.list-footer button { padding: 0.25rem 0.5rem; background: transparent; border: 1px solid #334155; color: #f1f5f9; border-radius: 4px; cursor: pointer; }

/* Viewer Panel */
.conv-viewer-panel { flex: 1; display: flex; flex-direction: column; background: #1e293b; }
.viewer-header { padding: 1.25rem; background: #0f172a; border-bottom: 1px solid #334155; }
.chat-title h4 { margin: 0; color: #f1f5f9; }
.audit-warning { color: #f59e0b; font-size: 0.75rem; font-weight: 600; }

.message-list { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.msg-row { display: flex; }
.msg-row.sent { justify-content: flex-end; }
.msg-bubble { max-width: 70%; padding: 0.75rem 1rem; border-radius: 12px; background: #334155; color: #f1f5f9; position: relative; }
.msg-row.sent .msg-bubble { background: #6366f1; }

.msg-sender { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem; opacity: 0.8; }
.msg-text { font-size: 0.9rem; line-height: 1.5; }
.msg-time { font-size: 0.65rem; color: #94a3b8; text-align: right; margin-top: 0.25rem; }
.msg-row.sent .msg-time { color: #c7d2fe; }

.no-selection { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; padding: 3rem; text-align: center; }
.placeholder-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.2; }

.loading-state, .empty-state { padding: 2rem; color: #64748b; text-align: center; font-style: italic; }
    `],
})
export class ConversationsComponent implements OnInit {
    conversations = signal<any[]>([]);
    messages = signal<any[]>([]);
    loadingConversations = signal(true);
    loadingMessages = signal(false);
    selectedId = signal<string | null>(null);
    selectedConv = signal<any>(null);

    userIdFilter = '';
    page = signal(1);
    pages = signal(1);

    constructor(private api: AdminApiService) { }

    ngOnInit() {
        this.loadConversations();
    }

    async loadConversations() {
        this.loadingConversations.set(true);
        try {
            const res = await this.api.getConversations({
                page: this.page(),
                limit: 15,
                userId: this.userIdFilter
            });
            this.conversations.set(res.conversations);
            this.pages.set(res.pages);
        } catch { }
        this.loadingConversations.set(false);
    }

    async selectConversation(conv: any) {
        this.selectedId.set(conv._id);
        this.selectedConv.set(conv);
        this.loadingMessages.set(true);
        try {
            const res = await this.api.getConversationMessages(conv._id);
            this.messages.set(res.messages);
        } catch { }
        this.loadingMessages.set(false);
    }

    getSenderName(id: string): string {
        const p = this.selectedConv()?.participants.find((x: any) => x._id === id);
        return p?.fullName || 'User';
    }

    prevPage() { this.page.update(p => p - 1); this.loadConversations(); }
    nextPage() { this.page.update(p => p + 1); this.loadConversations(); }
}
