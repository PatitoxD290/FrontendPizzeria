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
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

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
          descripcion_producto: '', // opcional
          categoria_id: 0,
          receta_id: null, // opcional
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => (this.imagePreview = e.target?.result || null);
      reader.readAsDataURL(file);
    }
  }

  saveProducto() {
    // ✅ Solo validamos los campos realmente obligatorios
    if (!this.producto.nombre_producto || !this.producto.precio_venta || !this.producto.categoria_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa los campos obligatorios: nombre, precio y categoría.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    // Si hay imagen → FormData
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('nombre_producto', this.producto.nombre_producto);
      formData.append('descripcion_producto', this.producto.descripcion_producto || '');
      formData.append('categoria_id', String(this.producto.categoria_id));

      // ✅ receta_id es opcional
      formData.append('receta_id', this.producto.receta_id ? String(this.producto.receta_id) : '');

      formData.append('precio_venta', String(this.producto.precio_venta));
      formData.append('estado', this.producto.estado || 'A');

      if (!this.producto.producto_id || this.producto.producto_id === 0) {
        this.productoService.createProductoFormData(formData).subscribe({
          next: () => this.handleSuccess('Producto creado', 'El producto se registró correctamente.'),
          error: (err) => this.handleError('crear', err)
        });
      } else {
        this.productoService.updateProductoFormData(this.producto.producto_id, formData).subscribe({
          next: () => this.handleSuccess('Producto actualizado', 'El producto fue actualizado correctamente.'),
          error: (err) => this.handleError('actualizar', err)
        });
      }
    } else {
      // Si NO hay imagen → JSON normal
      if (!this.producto.producto_id || this.producto.producto_id === 0) {
        this.productoService.createProducto(this.producto).subscribe({
          next: () => this.handleSuccess('Producto creado', 'El producto se registró correctamente.'),
          error: (err) => this.handleError('crear', err)
        });
      } else {
        this.productoService.updateProducto(this.producto.producto_id, this.producto).subscribe({
          next: () => this.handleSuccess('Producto actualizado', 'El producto fue actualizado correctamente.'),
          error: (err) => this.handleError('actualizar', err)
        });
      }
    }
  }

  private handleSuccess(title: string, text: string) {
    Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 1500,
      showConfirmButton: false
    });
    this.dialogRef.close(true);
  }

  private handleError(action: string, err: any) {
    console.error(`Error al ${action} producto`, err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `No se pudo ${action} el producto.`,
      confirmButtonColor: '#d33'
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}
