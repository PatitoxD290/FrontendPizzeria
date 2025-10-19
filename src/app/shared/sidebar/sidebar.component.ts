import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isCollapsed = false;

  isLoggedIn = false;
  menuItems = [
    { label: 'Gráficos', route: '/dashboard/graficos', icon: 'bar_chart' },
    { label: 'Inventario', route: '/dashboard/inventario', icon: 'inventory' }
  ];

  constructor(private router: Router, private authService: AuthService) {
    this.checkUser();
  }

  checkUser() {
    const user = this.authService.getUser();
    this.isLoggedIn = !!user;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
