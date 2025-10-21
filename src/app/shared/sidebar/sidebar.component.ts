import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, NgIf  } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from '../../core/services/auth/auth.service';

export interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  children?: MenuItem[];
  isExpanded?: boolean;
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
    MatExpansionModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;

  isLoggedIn = false;

  // Rutas del sidebar organizadas por categorías
  menuSections: { label?: string; items: MenuItem[] }[] = [
    {
      items: [
        { label: 'Inicio', route: '/dashboard/home', icon: 'home' }
      ]
    },
    {
      label: 'Ventas',
      items: [
        { label: 'Clientes', route: '/dashboard/cliente', icon: 'groups' },
        { label: 'Pedidos', route: '/dashboard/pedido', icon: 'local_pizza' },
        { label: 'Ventas', route: '/dashboard/venta', icon: 'point_of_sale' }
      ]
    },
    {
      label: 'Inventario',
      items: [
        { 
          label: 'Gestión de Productos', 
          icon: 'inventory', 
          children: [
            { label: 'Productos', route: '/dashboard/producto', icon: 'inventory_2' },
            { label: 'Categorías', route: '/dashboard/categoria', icon: 'category' },
            { label: 'Recetas', route: '/dashboard/receta', icon: 'restaurant_menu' },
          ],
          isExpanded: false
        },
        { label: 'Proveedores', route: '/dashboard/proveedor', icon: 'local_shipping' }
      ]
    },
    {
      label: 'Administración',
      items: [
        { label: 'Usuarios', route: '/dashboard/usuario', icon: 'person' }
      ]
    }
  ];

  constructor(
    private router: Router, 
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkUser();
  }

  private checkUser(): void {
    const user = this.authService.getUser();
    this.isLoggedIn = !!user;
  }

  toggleSubMenu(menuItem: MenuItem): void {
    if (menuItem.children && !this.isCollapsed) {
      menuItem.isExpanded = !menuItem.isExpanded;
    }
  }

  isRouteActive(route: string): boolean {
    return this.router.isActive(route, {
      paths: 'subset',
      queryParams: 'subset',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }

  navigateTo(route?: string, event?: Event): void {
    event?.stopPropagation();
    if (route) {
      this.router.navigate([route]);
    }
  }
}