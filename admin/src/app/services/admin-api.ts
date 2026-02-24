import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
    private base = `${environment.apiUrl}/admin`;

    constructor(private http: HttpClient) { }

    private get headers(): HttpHeaders {
        const token = localStorage.getItem('admin_token') || '';
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    private get<T>(path: string, params?: Record<string, any>): Promise<T> {
        let httpParams = new HttpParams();
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, v);
            });
        }
        return firstValueFrom(this.http.get<T>(`${this.base}${path}`, { headers: this.headers, params: httpParams }));
    }

    private put<T>(path: string, body: any = {}): Promise<T> {
        return firstValueFrom(this.http.put<T>(`${this.base}${path}`, body, { headers: this.headers }));
    }

    private delete<T>(path: string): Promise<T> {
        return firstValueFrom(this.http.delete<T>(`${this.base}${path}`, { headers: this.headers }));
    }

    private post<T>(path: string, body: any = {}): Promise<T> {
        return firstValueFrom(this.http.post<T>(`${this.base}${path}`, body, { headers: this.headers }));
    }

    // Stats
    getStats(): Promise<any> { return this.get('/stats'); }

    // Users
    getUsers(params?: any): Promise<any> { return this.get('/users', params); }
    getUser(id: string): Promise<any> { return this.get(`/users/${id}`); }
    createUser(data: any): Promise<any> { return this.post('/users', data); }
    suspendUser(id: string): Promise<any> { return this.put(`/users/${id}/suspend`); }
    verifyUser(id: string): Promise<any> { return this.put(`/users/${id}/verify`); }
    setMembership(id: string, tier: string): Promise<any> { return this.put(`/users/${id}/membership`, { tier }); }
    deleteUser(id: string): Promise<any> { return this.delete(`/users/${id}`); }

    // Profiles
    getProfiles(params?: any): Promise<any> { return this.get('/profiles', params); }
    getProfile(id: string): Promise<any> { return this.get(`/profiles/${id}`); }
    deactivateProfile(id: string): Promise<any> { return this.put(`/profiles/${id}/deactivate`); }
    featureProfile(id: string): Promise<any> { return this.put(`/profiles/${id}/feature`); }

    // Reports (Cursor's endpoints — used by Cursor's components)
    getReports(params?: any): Promise<any> { return this.get('/reports', params); }
    resolveReport(id: string): Promise<any> { return this.put(`/reports/${id}/resolve`); }
    dismissReport(id: string): Promise<any> { return this.put(`/reports/${id}/dismiss`); }

    // Orders (Cursor)
    getOrders(params?: any): Promise<any> { return this.get('/orders', params); }
    exportOrders(params?: any): Promise<Blob> {
        let url = `${this.base}/export/orders`;
        const p = new URLSearchParams();
        if (params?.status) p.set('status', params.status);
        if (params?.plan) p.set('plan', params.plan);
        if (p.toString()) url += '?' + p.toString();
        return firstValueFrom(this.http.get(url, { headers: this.headers, responseType: 'blob' }));
    }

    // Interests (Cursor)
    getInterests(params?: any): Promise<any> { return this.get('/interests', params); }

    // Audit Log (Cursor)
    getAuditLog(params?: any): Promise<any> { return this.get('/audit-log', params); }

    // Platform Settings (Cursor)
    getPlatformSettings(): Promise<any> { return this.get('/settings'); }
    putPlatformSettings(settings: any): Promise<any> { return this.put('/settings', settings); }

    // Announcements (Cursor)
    getAnnouncements(): Promise<any[]> { return this.get('/announcements'); }
    createAnnouncement(data: any): Promise<any> { return this.post('/announcements', data); }
    updateAnnouncement(id: string, data: any): Promise<any> { return this.put(`/announcements/${id}`, data); }
    deleteAnnouncement(id: string): Promise<any> { return this.delete(`/announcements/${id}`); }

    // Impersonation
    impersonateUser(userId: string): Promise<any> { return this.post(`/impersonate/${userId}`); }

    // Conversation Audit
    getConversations(params?: any): Promise<any> { return this.get('/conversations', params); }
    getConversationMessages(id: string): Promise<any> { return this.get(`/conversations/${id}/messages`); }
}
