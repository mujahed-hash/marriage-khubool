import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService
  ) {
    this.checkImpersonation();
  }

  async checkImpersonation() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.loading = true;
      try {
        this.api.setToken(token);
        const ok = await this.authService.refreshSession();
        if (ok) {
          this.router.navigate(['/']);
          return;
        }
      } catch (e) {
        console.error('Impersonation failed:', e);
      } finally {
        this.loading = false;
      }
    }
  }

  async onLogin() {
    this.error = '';
    this.loading = true;
    try {
      const result = await this.authService.login(this.email, this.password);
      if (result.ok) {
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        this.router.navigateByUrl(redirect && redirect.startsWith('/') ? redirect : '/');
      } else {
        this.error = result.error || 'Invalid email or password';
      }
    } catch (e) {
      this.error = (e as Error).message || 'Login failed. Is the backend running?';
    } finally {
      this.loading = false;
    }
  }
}
