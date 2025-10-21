import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  @Input() isSidebarCollapsed = false; // ⚡ Corregido

  nombreUsuario: string = '';
  searchQuery: string = '';
  isDarkMode = false;
  notificationsCount = 5;
  mostrarNavbar: boolean = true;

  constructor(private router: Router, private authService: AuthService) {
    const user = this.authService.getUser();
    this.nombreUsuario = user?.nombre ?? '';
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    this.updateBodyClass();

    this.router.events.subscribe(() => {
      const url = this.router.url;
      this.mostrarNavbar = !url.includes('/dashboard/login');
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/dashboard/login']);
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    this.updateBodyClass();
  }

  private updateBodyClass() {
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  openNotifications() {
    console.log('Abriendo notificaciones...');
  }

  toggleSidebar() {
    this.toggleSidebarEvent.emit();
  }
}
