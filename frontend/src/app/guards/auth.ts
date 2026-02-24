import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api.service';

export const authGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const api = inject(ApiService);
    const router = inject(Router);

    if (api.getToken() && authService.isAuthenticated()) {
        return true;
    }
    const redirect = state.url ? '/login?redirect=' + encodeURIComponent(state.url) : '/login';
    return router.parseUrl(redirect);
};
