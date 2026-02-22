import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  async onRegister() {
    this.error = '';
    this.loading = true;
    try {
      const result = await this.authService.register(this.email, this.password, this.name);
      if (result.ok) {
        this.router.navigate(['/create-profile']);
      } else {
        this.error = result.error || 'Registration failed';
      }
    } catch (e) {
      this.error = (e as Error).message || 'Registration failed. Is the backend running?';
    } finally {
      this.loading = false;
    }
  }
}
