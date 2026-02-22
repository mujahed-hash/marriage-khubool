import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface User {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  membership: 'bronze' | 'silver' | 'gold' | 'diamond' | 'crown';
}

const USER_KEY = 'khubool_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);

  constructor(private api: ApiService) {
    const token = this.api.getToken();
    const savedUser = localStorage.getItem(USER_KEY);
    if (token && savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
      this.isAuthenticatedSignal.set(true);
    }
  }

  get user() {
    return this.currentUser.asReadonly();
  }

  get isAuthenticated() {
    return this.isAuthenticatedSignal.asReadonly();
  }

  private mapUser(res: { id: string; email: string; fullName: string; membershipTier?: string }): User {
    return {
      id: res.id,
      email: res.email,
      name: res.fullName || res.email.split('@')[0],
      fullName: res.fullName,
      membership: (res.membershipTier as User['membership']) || 'bronze'
    };
  }

  async login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await this.api.post<{ token: string; user: unknown }>('/auth/login', { email, password });
      const data = res as { token: string; user: { id: string; email: string; fullName: string; membershipTier?: string } };
      this.api.setToken(data.token);
      const user = this.mapUser(data.user);
      this.currentUser.set(user);
      this.isAuthenticatedSignal.set(true);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  async register(email: string, password: string, fullName: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await this.api.post<{ token: string; user: unknown }>('/auth/register', {
        email,
        password,
        fullName
      });
      const data = res as { token: string; user: { id: string; email: string; fullName: string; membershipTier?: string } };
      this.api.setToken(data.token);
      const user = this.mapUser(data.user);
      this.currentUser.set(user);
      this.isAuthenticatedSignal.set(true);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticatedSignal.set(false);
    this.api.clearToken();
    localStorage.removeItem(USER_KEY);
  }

  async refreshSession(): Promise<boolean> {
    const token = this.api.getToken();
    if (!token) return false;
    try {
      const res = await this.api.get<{ _id?: string; id?: string; email: string; fullName: string; membershipTier?: string }>('/auth/me');
      const id = res.id ?? res._id;
      if (id && res.email) {
        const user = this.mapUser({ id: String(id), email: res.email, fullName: res.fullName, membershipTier: res.membershipTier });
        this.currentUser.set(user);
        this.isAuthenticatedSignal.set(true);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return true;
      }
    } catch {
      this.logout();
    }
    return false;
  }
}
