import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api.service';

export const authGuard = () => {
    const authService = inject(AuthService);
    const api = inject(ApiService);
    const router = inject(Router);

    if (api.getToken() && authService.isAuthenticated()) {
        return true;
    }
    return router.parseUrl('/login');
};
