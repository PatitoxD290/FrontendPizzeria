import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';

interface Producto {
  nombre: string;
  categoria: string;
  precio: number;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatCardModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  searchTerm: string = '';
  filtroCategoria: string = '';

  productos: Producto[] = [
    { nombre: 'Pizza Margarita', categoria: 'Pizzas', precio: 25 },
    { nombre: 'Pizza Pepperoni', categoria: 'Pizzas', precio: 28 },
    { nombre: 'Coca Cola 500ml', categoria: 'Bebidas', precio: 5 },
    { nombre: 'Inca Kola 1L', categoria: 'Bebidas', precio: 7 },
    { nombre: 'Combo Familiar', categoria: 'Combos', precio: 50 },
    { nombre: 'Combo Pareja', categoria: 'Combos', precio: 30 }
  ];

  get productosFiltrados(): Producto[] {
    return this.productos.filter(p => {
      const coincideCategoria = this.filtroCategoria ? p.categoria === this.filtroCategoria : true;
      const coincideBusqueda = this.searchTerm
        ? p.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
      return coincideCategoria && coincideBusqueda;
    });
  }
}
