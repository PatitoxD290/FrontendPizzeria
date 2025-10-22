import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
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
    NgIf,
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

  // Rutas del sidebar organizadas por categorías - SIN NÚMEROS
  menuSections: { label?: string; items: MenuItem[] }[] = [
    {
      items: [
        { 
          label: 'Inicio', 
          route: '/dashboard/home', 
          icon: 'home' // Cambiado a casa
        }
      ]
    },
    {
      label: 'Ventas',
      items: [
        { 
          label: 'Clientes', 
          route: '/dashboard/cliente', 
          icon: 'groups'
        },
        { 
          label: 'Pedidos', 
          route: '/dashboard/pedido', 
          icon: 'local_pizza'
        },
        { 
          label: 'Ventas', 
          route: '/dashboard/venta', 
          icon: 'point_of_sale'
        }
      ]
    },
    {
      label: 'Inventario',
      items: [
        { 
          label: 'Gestión de Productos', 
          icon: 'inventory_2', 
          children: [
            { label: 'Productos', route: '/dashboard/producto', icon: 'fastfood' },
            { label: 'Categorías', route: '/dashboard/categoria', icon: 'category' },
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
      label: 'Reportes',
      items: [
        { 
          label: 'Analíticas', 
          route: '/dashboard/reportes', 
          icon: 'analytics'
        }
      ]
    },
    {
      label: 'Administración',
      items: [
        { label: 'Usuarios', route: '/dashboard/usuario', icon: 'people' },
        { label: 'Configuración', route: '/dashboard/configuracion', icon: 'settings' }
      ]
    }
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
          // Expandir si alguna ruta hija está activa
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

  // Método para simular notificaciones (puedes conectar con tu servicio real)
  getBadgeCount(item: MenuItem): number {
    return item.badge || 0;
  }
}