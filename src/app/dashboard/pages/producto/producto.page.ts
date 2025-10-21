// src/app/dashboard/pages/producto/producto.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ProductoListComponent } from '../../components/producto/producto-list/producto-list.component';
import { ProductoFormComponent } from '../../components/producto/producto-form/producto-form.component';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, ProductoListComponent],
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.css']
})
export class ProductoPage {
  constructor(private dialog: MatDialog) {}

  openNuevoProducto(productoList: ProductoListComponent) {
    const dialogRef = this.dialog.open(ProductoFormComponent, { width: '500px', data: {} });
    dialogRef.afterClosed().subscribe(result => { if (result) productoList.loadProductos(); });
  }
}
