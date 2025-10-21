// src/app/dashboard/components/producto-form/producto-form.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../../core/models/producto.model';
import { ProductoService } from '../../../services/producto.service';
import { CategoriaService } from '../../../services/categoria.service';
import { RecetaService } from '../../../services/receta.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './producto-form.component.html',
  styleUrls: ['./producto-form.component.css']
})
export class ProductoFormComponent implements OnInit {

  producto: Producto;
  categorias: any[] = [];
  recetas: any[] = [];

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private recetaService: RecetaService,
    private dialogRef: MatDialogRef<ProductoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { producto?: Producto }
  ) {
    // Si llega un producto, se edita; sino se crea nuevo
    this.producto = data?.producto
      ? { ...data.producto }
      : {
          producto_id: 0,
          nombre_producto: '',
          descripcion_producto: '',
          categoria_id: 0,
          receta_id: null,
          precio_venta: 0,
          estado: 'A'
        };
  }

  ngOnInit(): void {
    this.loadCategorias();
    this.loadRecetas();
  }

  loadCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => (this.categorias = data),
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  loadRecetas() {
    this.recetaService.getRecetas().subscribe({
      next: (data) => (this.recetas = data),
      error: (err) => console.error('Error al cargar recetas', err)
    });
  }

  saveProducto() {
    if (!this.producto.producto_id || this.producto.producto_id === 0) {
      // Crear nuevo producto
      this.productoService.createProducto(this.producto).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al crear producto', err)
      });
    } else {
      // Editar producto existente
      this.productoService.updateProducto(this.producto.producto_id!, this.producto).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al actualizar producto', err)
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
