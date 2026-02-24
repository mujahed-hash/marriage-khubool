import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { VisitorService } from '../../services/visitor.service';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  visitorCount = 0;
  private visitorService = inject(VisitorService);
  public layoutService = inject(LayoutService);

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadVisitorCount();
    }
  }

  async loadVisitorCount() {
    try {
      const res = await this.visitorService.getMyVisitors();
      this.visitorCount = res.visitors?.length || 0;
    } catch { }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.visitorCount = 0;
    this.layoutService.closeSidebar();
  }
}
