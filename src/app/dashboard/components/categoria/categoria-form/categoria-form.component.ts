import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Asegúrate de que la ruta a tus modelos sea correcta
import { CategoriaProducto, CategoriaInsumos } from '../../../../core/models/categoria.model';
import { CategoriaService } from '../../../../core/services/categoria.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './categoria-form.component.html',
  styleUrls: ['./categoria-form.component.css']
})
export class CategoriaFormComponent {

  tipoCategoria: 'producto' | 'insumo' = 'producto';
  
  // Usamos una unión de tipos para manejar ambos casos
  categoria: CategoriaProducto | CategoriaInsumos;
  
  esTogglePermitido: boolean;

  constructor(
    private categoriaService: CategoriaService,
    private dialogRef: MatDialogRef<CategoriaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoria?: CategoriaProducto | CategoriaInsumos, tipo?: 'producto' | 'insumo' }
  ) {
    // Tipo inicial (si viene desde el diálogo o por defecto 'producto')
    this.tipoCategoria = data?.tipo || 'producto';
    
    // Permitir cambiar tipo solo si es nueva categoría (no en edición)
    this.esTogglePermitido = !data?.categoria;

    // Inicializar el objeto según el tipo
    if (this.tipoCategoria === 'producto') {
      this.categoria = data?.categoria
        ? { ...(data.categoria as CategoriaProducto) }
        : { ID_Categoria_P: 0, Nombre: '' };
    } else {
      this.categoria = data?.categoria
        ? { ...(data.categoria as CategoriaInsumos) }
        : { ID_Categoria_I: 0, Nombre: '' };
    }
  }

  // 🔁 Alternar entre tipo de categoría (solo para nuevas categorías)
  toggleTipo() {
    if (!this.esTogglePermitido) return;
    
    // Conservar el nombre escrito al cambiar de tipo
    const nombreActual = this.categoria.Nombre;

    if (this.tipoCategoria === 'producto') {
      this.tipoCategoria = 'insumo';
      this.categoria = { ID_Categoria_I: 0, Nombre: nombreActual };
    } else {
      this.tipoCategoria = 'producto';
      this.categoria = { ID_Categoria_P: 0, Nombre: nombreActual };
    }
  }

  // 🧠 Getter para saber si estamos editando o creando
  get esEdicion(): boolean {
    if (this.tipoCategoria === 'producto') {
      return (this.categoria as CategoriaProducto).ID_Categoria_P > 0;
    } else {
      return (this.categoria as CategoriaInsumos).ID_Categoria_I > 0;
    }
  }

  // Obtener el ID actual de la categoría de forma dinámica
  get idCategoria(): number {
    if (this.tipoCategoria === 'producto') {
      return (this.categoria as CategoriaProducto).ID_Categoria_P;
    } else {
      return (this.categoria as CategoriaInsumos).ID_Categoria_I;
    }
  }

  // Textos para la UI
  get tipoCategoriaTexto(): string {
    return this.tipoCategoria === 'producto' ? 'Productos' : 'Insumos';
  }

  get iconoTipo(): string {
    return this.tipoCategoria === 'producto' ? 'shopping_bag' : 'inventory_2';
  }

  get colorTipo(): string {
    return this.tipoCategoria === 'producto' ? 'primary' : 'accent';
  }

  // 💾 Guardar categoría
  saveCategoria() {
    // 1. Validaciones y Formato
    if (this.categoria.Nombre) {
      this.categoria.Nombre = this.capitalizeWords(this.categoria.Nombre.trim());
    }

    if (!this.categoria.Nombre.trim()) {
      Swal.fire('Error', 'El nombre de la categoría es obligatorio', 'warning');
      return;
    }

    // 2. Preparar DTO (Objeto limpio solo con lo necesario)
    const dto = { Nombre: this.categoria.Nombre };

    // 3. Lógica según tipo (Producto vs Insumo)
    if (this.tipoCategoria === 'producto') {
      const id = (this.categoria as CategoriaProducto).ID_Categoria_P;

      if (!id || id === 0) {
        // CREAR PRODUCTO
        this.categoriaService.createCategoriaProducto(dto).subscribe({
          next: () => this.handleSuccess('Categoría de productos creada correctamente'),
          error: (err) => this.handleError('Error al crear categoría de productos', err)
        });
      } else {
        // ACTUALIZAR PRODUCTO
        this.categoriaService.updateCategoriaProducto(id, dto).subscribe({
          next: () => this.handleSuccess('Categoría de productos actualizada correctamente'),
          error: (err) => this.handleError('Error al actualizar categoría de productos', err)
        });
      }
    } else {
      // ES INSUMO
      const id = (this.categoria as CategoriaInsumos).ID_Categoria_I;

      if (!id || id === 0) {
        // CREAR INSUMO
        this.categoriaService.createCategoriaInsumo(dto).subscribe({
          next: () => this.handleSuccess('Categoría de insumos creada correctamente'),
          error: (err) => this.handleError('Error al crear categoría de insumos', err)
        });
      } else {
        // ACTUALIZAR INSUMO
        this.categoriaService.updateCategoriaInsumo(id, dto).subscribe({
          next: () => this.handleSuccess('Categoría de insumos actualizada correctamente'),
          error: (err) => this.handleError('Error al actualizar categoría de insumos', err)
        });
      }
    }
  }
  
  // Helpers privados
  private handleSuccess(msg: string) {
    Swal.fire('¡Éxito!', msg, 'success');
    this.dialogRef.close(true); // Retorna true para recargar lista
  }

  private handleError(msg: string, err: any) {
    console.error(err);
    Swal.fire('Error', msg, 'error');
  }

  private capitalizeWords(text: string): string {
    return text
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  close() {
    this.dialogRef.close(false);
  }
}