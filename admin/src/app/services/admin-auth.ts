import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
    private readonly TOKEN_KEY = 'admin_token';
    private readonly USER_KEY = 'admin_user';

    constructor(private http: HttpClient, private router: Router) { }

    async login(email: string, password: string): Promise<void> {
        const res: any = await firstValueFrom(
            this.http.post(`${environment.apiUrl}/auth/login`, { email, password })
        );
        if (!res.user?.isAdmin) {
            throw new Error('Access denied. Admin account required.');
        }
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getUser(): any {
        const u = localStorage.getItem(this.USER_KEY);
        return u ? JSON.parse(u) : null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}
