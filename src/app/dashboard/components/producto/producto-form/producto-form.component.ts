import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../../core/models/producto.model';
import { ProductoService } from '../../../services/producto.service';
import { CategoriaService } from '../../../services/categoria.service';
import { RecetaService } from '../../../services/receta.service';
import Swal from 'sweetalert2';

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
    // Validación básica
    if (!this.producto.nombre_producto || !this.producto.precio_venta || !this.producto.categoria_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa los campos obligatorios antes de guardar.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Si no tiene ID, es nuevo producto
    if (!this.producto.producto_id || this.producto.producto_id === 0) {
      this.productoService.createProducto(this.producto).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Producto creado',
            text: 'El producto se registró correctamente.',
            timer: 1500,
            showConfirmButton: false
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al crear producto', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear el producto.',
            confirmButtonColor: '#d33'
          });
        }
      });
    } else {
      // Si tiene ID, se actualiza
      this.productoService.updateProducto(this.producto.producto_id, this.producto).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Producto actualizado',
            text: 'El producto fue actualizado correctamente.',
            timer: 1500,
            showConfirmButton: false
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al actualizar producto', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el producto.',
            confirmButtonColor: '#d33'
          });
        }
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
