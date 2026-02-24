import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar';
import { SidebarComponent } from '../sidebar';
import { RightSidebarComponent } from '../right-sidebar';
import { MaintenanceBannerComponent } from '../maintenance-banner/maintenance-banner';
import { GuestBannerComponent } from '../guest-banner';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, RightSidebarComponent, MaintenanceBannerComponent, GuestBannerComponent],
    templateUrl: './main-layout.html',
    styleUrl: './main-layout.css'
})
export class MainLayoutComponent { }
