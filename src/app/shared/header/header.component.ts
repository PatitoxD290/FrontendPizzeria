import { Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, Data } from '@angular/router';
import { filter, map, mergeMap, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input'; // Importamos MatInputModule para la barra de búsqueda
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Asegúrate de importar FormsModule aquí

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule,
    FormsModule // Aquí importamos FormsModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  titulo: string = '';
  subtitulo: string = '';

  mostrarHeader: boolean = false;
  mostrarNavbar: boolean = false;

  nombreUsuario: string = '';
  searchQuery: string = '';  // Variable para la barra de búsqueda

  isDarkMode = false;
  notificationsCount = 5; // Número de notificaciones (aquí solo está estático)

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        startWith(null),
        map(() => this.route),
        map(route => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap(route => route.data)
      )
      .subscribe((data: Data) => {
        this.titulo = data['title'] ?? '';
        this.subtitulo = data['subtitle'] ?? '';

        const currentUrl = this.router.url;

        this.mostrarHeader = currentUrl.startsWith('/menu') || currentUrl.startsWith('/pago');

        const user = this.authService.getUser();
        this.mostrarNavbar = user?.rol === 'ADMIN';

        this.nombreUsuario = user?.nombre ?? '';
      });

    // Inicializa el modo oscuro según preferencia guardada o sistema
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    this.updateBodyClass();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
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

  // Método para abrir la ventana de notificaciones (sin funcionalidad aún)
  openNotifications() {
    console.log('Abriendo ventana de notificaciones...');
  }
}
