import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

import { ProductoListComponent } from '../../components/producto/producto-list/producto-list.component';
import { CategoriaListComponent } from '../../components/categoria/categoria-list/categoria-list.component';
import { TamanoListComponent } from '../../components/tamano/tamano-list/tamano-list.component';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    ProductoListComponent,
    CategoriaListComponent,
    TamanoListComponent
  ],
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.css']
})
export class ProductoPage {
  mostrarProductos = true;  // por defecto se muestra la lista de productos
  mostrarCategorias = false;

  mostrarLista(lista: 'productos' | 'categorias') {
    this.mostrarProductos = lista === 'productos';
    this.mostrarCategorias = lista === 'categorias';
  }
}
