import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

import { ProductoListComponent } from '../../components/producto/producto-list/producto-list.component';
import { ProductoFormComponent } from '../../components/producto/producto-form/producto-form.component';
import { CategoriaListComponent } from '../../components/categoria/categoria-list/categoria-list.component';
import { CategoriaFormComponent } from '../../components/categoria/categoria-form/categoria-form.component';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ProductoListComponent,
    CategoriaListComponent
  ],
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.css']
})
export class ProductoPage {
  @ViewChild(ProductoListComponent) productoList!: ProductoListComponent;

  constructor(private dialog: MatDialog) {}

  openNuevoProducto(productoList: ProductoListComponent) {
    const dialogRef = this.dialog.open(ProductoFormComponent, { width: '500px', data: {} });
    dialogRef.afterClosed().subscribe(result => {
      if (result) productoList.loadProductos();
    });
  }

  openNuevaCategoria() {
    const dialogRef = this.dialog.open(CategoriaFormComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // refrescar categorías si deseas
      }
    });
  }

  onCategoriaSeleccionada(categoriaId: number) {
    this.productoList.filterByCategoria(categoriaId);
  }
}
