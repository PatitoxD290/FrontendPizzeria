import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';

// Angular Material - AGREGAR MatDividerModule
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider'; // ← AÑADIR ESTA LÍNEA

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
    MatInputModule,
    MatTooltipModule,
    MatDividerModule // ← AÑADIR ESTA LÍNEA
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  @Input() isSidebarCollapsed = false;

  nombreUsuario: string = '';
  searchQuery: string = '';
  isDarkMode = false;
  notificationsCount = 3;
  mostrarNavbar: boolean = true;
  showSuggestions = false;

  constructor(private router: Router, private authService: AuthService) {
    const user = this.authService.getUser();
    this.nombreUsuario = user?.nombre ?? 'Usuario';
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

  onSearch() {
    if (this.searchQuery.trim()) {
      console.log('Buscando:', this.searchQuery);
      this.showSuggestions = false;
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.showSuggestions = false;
  }

  searchByType(type: string) {
    console.log(`Buscando ${type} con:`, this.searchQuery);
    this.showSuggestions = false;
    
    const routes = {
      'pedido': '/dashboard/pedido',
      'cliente': '/dashboard/cliente', 
      'producto': '/dashboard/producto'
    };
    
    if (routes[type as keyof typeof routes]) {
      this.router.navigate([routes[type as keyof typeof routes]], {
        queryParams: { search: this.searchQuery }
      });
    }
  }

  onSearchFocus() {
    if (this.searchQuery) {
      this.showSuggestions = true;
    }
  }

  onSearchBlur() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }
}