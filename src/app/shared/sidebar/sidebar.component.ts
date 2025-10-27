import { Component, Input, OnInit, OnDestroy } from '@angular/core';
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

export interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  children?: MenuItem[];
  isExpanded?: boolean;
  badge?: number;
  badgeColor?: 'primary' | 'accent' | 'warn';
}

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

  isLoggedIn = false;
  private routerSubscription!: Subscription;
  currentRoute = '';

  // Rutas del sidebar organizadas por categorías
  menuSections: { label?: string; items: MenuItem[] }[] = [
    {
      items: [
        { 
          label: 'Inicio', 
          route: '/dashboard/home', 
          icon: 'home'
        }
      ]
    },
    {
      items: [
      { 
        label: 'Pedidos', 
        icon: 'local_pizza',
        children: [
          { label: 'Realizar Pedido', route: '/dashboard/realizarpedido', icon: 'add_shopping_cart' },
          { label: 'Registro de Pedidos', route: '/dashboard/registropedidos', icon: 'receipt_long' }
        ],
        isExpanded: false
      },
        { 
          label: 'Registro de Ventas', 
          route: '/dashboard/venta', 
          icon: 'point_of_sale'
        },
        { 
          label: 'Historial de Clientes', 
          route: '/dashboard/cliente', 
          icon: 'groups'
        }
      ]
    },
    {
      label: 'Inventario',
      items: [
        { 
          label: 'Configuración del Menú', 
          icon: 'inventory_2', 
          children: [
            { label: 'Productos y Categorias', route: '/dashboard/producto', icon: 'fastfood' },
            { label: 'Recetas', route: '/dashboard/receta', icon: 'restaurant_menu' },
          ],
          isExpanded: false
        },
        { 
          label: 'Gestión de Insumos', 
          icon: 'warehouse', 
          children: [
            { label: 'Ingredientes', route: '/dashboard/ingrediente', icon: 'egg' },
            { label: 'Stock', route: '/dashboard/stock', icon: 'inventory' },
            { label: 'Proveedores', route: '/dashboard/proveedor', icon: 'local_shipping' },
          ],
          isExpanded: false
        }
      ]
    },
    {
      label: '',
      items: [
        { 
          label: 'Analíticas', 
          route: '/dashboard/reportes', 
          icon: 'analytics'
        }
      ]
    },
  ];

  constructor(
    private router: Router, 
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkUser();
    this.setupRouteTracking();
    this.autoExpandActiveMenu();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private checkUser(): void {
    const user = this.authService.getUser();
    this.isLoggedIn = !!user;
  }

  private setupRouteTracking(): void {
    this.currentRoute = this.router.url;
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        this.autoExpandActiveMenu();
      });
  }

  private autoExpandActiveMenu(): void {
    this.menuSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => 
            child.route && this.isRouteActive(child.route)
          );
          item.isExpanded = hasActiveChild;
        }
      });
    });
  }

  toggleSubMenu(menuItem: MenuItem): void {
    if (menuItem.children && !this.isCollapsed) {
      menuItem.isExpanded = !menuItem.isExpanded;
    }
  }

  isRouteActive(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  navigateTo(route?: string, event?: Event): void {
    event?.stopPropagation();
    if (route) {
      this.router.navigate([route]);
    }
  }

  getBadgeCount(item: MenuItem): number {
    return item.badge || 0;
  }

  onMenuItemClick(item: MenuItem, event?: Event): void {
    if (item.children) {
      this.toggleSubMenu(item);
    } else if (item.route) {
      this.navigateTo(item.route, event);
    }
  }
}