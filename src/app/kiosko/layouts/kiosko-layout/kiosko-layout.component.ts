import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

// 🧩 Componentes del kiosko
import { CarritoFlotanteComponent } from '../../components/carrito-flotante/carrito-flotante.component';

// 🧱 Componentes compartidos
import { HeaderComponent } from '../../../shared/header/header.component';
import { FooterComponent } from '../../../shared/footer/footer.component';

@Component({
  selector: 'app-kiosko-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    CarritoFlotanteComponent,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './kiosko-layout.component.html',
  styleUrls: ['./kiosko-layout.component.css']
})
export class KioskoLayoutComponent {
  constructor(private router: Router) {}

  // ✅ Oculta header y footer solo en /iniciar
  mostrarHeaderFooter(): boolean {
    return !this.router.url.includes('iniciar');
  }
}
