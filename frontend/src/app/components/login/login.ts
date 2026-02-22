import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

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

  constructor(private authService: AuthService, private router: Router) {}

  async onLogin() {
    this.error = '';
    this.loading = true;
    try {
      const result = await this.authService.login(this.email, this.password);
      if (result.ok) {
        this.router.navigate(['/']);
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
