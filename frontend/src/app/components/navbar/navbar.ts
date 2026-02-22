import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme';
import { AuthService } from '../../services/auth';
import { VisitorService } from '../../services/visitor.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  dropdownOpen = false;
  menuOpen = signal(false);
  searchQuery = '';
  visitorCount = 0;
  notificationCount = signal(0);

  private visitorService = inject(VisitorService);
  private notificationService = inject(NotificationService);

  constructor(
    public themeService: ThemeService,
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadVisitorCount();
      this.loadNotificationCount();
    }
  }

  async loadVisitorCount() {
    try {
      const res = await this.visitorService.getMyVisitors();
      this.visitorCount = res.visitors?.length || 0;
    } catch { }
  }

  async loadNotificationCount() {
    try {
      const res = await this.notificationService.getNotifications();
      this.notificationCount.set(res.unreadCount || 0);
    } catch { }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  onSearch() {
    const q = this.searchQuery?.trim();
    if (q) {
      this.router.navigate(['/search'], { queryParams: { q } });
    } else {
      this.router.navigate(['/search']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.dropdownOpen = false;
    this.visitorCount = 0;
    this.notificationCount.set(0);
  }
}
