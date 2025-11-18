import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth/auth.service';
import { filter, Subscription } from 'rxjs';



// ============================
// INTERFACE DEL MENU
// ============================
export interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  children?: MenuItem[];
  isExpanded?: boolean;
  badge?: number;
  badgeColor?: 'primary' | 'accent' | 'warn';
}

// ============================
// COMPONENTE
// ============================
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Output() toggleSidebarEvent = new EventEmitter<boolean>(); // <-- Agregado

  isLoggedIn = true;
  currentRoute = '';
  private routerSubscription!: Subscription;

  // ============================
  // MENU DEL SIDEBAR
  // ============================
menuSections: { label?: string; items: MenuItem[] }[] = [
  {
    items: [
      { label: 'Inicio', route: '/dashboard/home', icon: 'home' }
    ]
  },
  {
    items: [
      { label: 'Caja', route: '/dashboard/realizarpedido', icon: 'payments' }, // pago en caja
      { label: 'Pedidos', route: '/dashboard/registropedidos', icon: 'assignment' }, // registro de pedidos
      { label: 'Ventas', route: '/dashboard/venta', icon: 'sell' }, // icono de venta
      { label: 'Clientes', route: '/dashboard/cliente', icon: 'people_alt' } // clientes
    ]
  },
  {
    label: ' Menú',
    items: [
      { label: 'Productos', route: '/dashboard/producto', icon: 'fastfood' }, // comida
      { label: 'Categorías', route: '/dashboard/categoria', icon: 'category' }, // ícono corregido
      { label: 'Recetas', route: '/dashboard/receta', icon: 'menu_book' }, // libro de recetas
    ]
  },
  {
    label: 'Inventario',
    items: [
      { label: 'Stock', route: '/dashboard/stock', icon: 'inventory_2' }, // inventario
      { label: 'Ingredientes', route: '/dashboard/ingrediente', icon: 'emoji_food_beverage' }, // ingredientes
      { label: 'Proveedores', route: '/dashboard/proveedor', icon: 'local_shipping' }  // transporte/proveedor
    ]
  },
  {
    label: 'Configuración ',
    items: [
      { label: 'Usuarios', route: '/dashboard/usuario', icon: 'manage_accounts' } // configuración de empleados
    ]
  },
  {
    items: [
      { label: 'Analíticas', route: '/dashboard/reportes', icon: 'insights' } // reportes
    ]
  }
];




  constructor(private router: Router, private authService: AuthService) {}

ngOnInit(): void {
  this.checkUser();
  this.filtrarMenuPorRol(); 
  this.trackRouteChanges();
  this.autoExpandActiveMenu();
}


  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  // ============================
  // FUNCIONES
  // ============================
  private checkUser(): void {
    this.isLoggedIn = !!this.authService.getUser();
  }

  private trackRouteChanges(): void {
    this.currentRoute = this.router.url;
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.autoExpandActiveMenu();
      });
  }

  private autoExpandActiveMenu(): void {
    this.menuSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          item.isExpanded = item.children.some(child => this.isRouteActive(child.route!));
        }
      });
    });
  }

  toggleSubMenu(item: MenuItem): void {
  if (item.children && !this.isCollapsed) {
    // Cierra los demás submenús antes de abrir este
    this.menuSections.forEach(section => {
      section.items.forEach(i => {
        if (i !== item && i.children) {
          i.isExpanded = false;
        }
      });
    });

    // Alterna el actual
    item.isExpanded = !item.isExpanded;
    }
  }


  isRouteActive(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  navigateTo(route?: string, event?: Event): void {
    event?.stopPropagation();
    if (route) this.router.navigate([route]);
  }

  getBadgeCount(item: MenuItem): number {
    return item.badge || 0;
  }

  onMenuItemClick(item: MenuItem, event?: Event): void {
    if (item.children) this.toggleSubMenu(item);
    else if (item.route) this.navigateTo(item.route, event);
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.toggleSidebarEvent.emit(this.isCollapsed);
  }

  private filtrarMenuPorRol(): void {
  const rol = this.authService.getUserRol(); // 'A' o 'E'

  if (rol === 'E') {
    // Empleado solo ve: Caja, Pedidos, Ventas, Historial de Clientes + Inicio
    this.menuSections = [
      {
        items: [
          { label: 'Inicio', route: '/dashboard/home', icon: 'home' }
        ]
      },
      {
        items: [
          { label: 'Caja', route: '/dashboard/realizarpedido', icon: 'payments' },
          { label: 'Pedidos', route: '/dashboard/registropedidos', icon: 'assignment' },
          { label: 'Ventas', route: '/dashboard/venta', icon: 'sell' },
          { label: ' Clientes', route: '/dashboard/cliente', icon: 'people_alt' }
        ]
      }
    ];
  }
}

}
