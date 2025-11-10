import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  categoria: CategoriaProducto | CategoriaInsumos;
  esTogglePermitido: boolean;

  constructor(
    private categoriaService: CategoriaService,
    private dialogRef: MatDialogRef<CategoriaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoria?: CategoriaProducto | CategoriaInsumos, tipo?: 'producto' | 'insumo' }
  ) {
    // Tipo inicial (si viene desde el diálogo)
    this.tipoCategoria = data?.tipo || 'producto';
    
    // Permitir cambiar tipo solo si es nueva categoría (no en edición)
    this.esTogglePermitido = !data?.categoria;

    // Crear una nueva categoría o clonar la existente
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
    
    if (this.tipoCategoria === 'producto') {
      this.tipoCategoria = 'insumo';
      this.categoria = { ID_Categoria_I: 0, Nombre: this.categoria.Nombre };
    } else {
      this.tipoCategoria = 'producto';
      this.categoria = { ID_Categoria_P: 0, Nombre: this.categoria.Nombre };
    }
  }

  // 🧠 Getter para saber si estamos editando o creando
  get esEdicion(): boolean {
    if (this.tipoCategoria === 'producto') {
      return (this.categoria as CategoriaProducto)?.ID_Categoria_P > 0;
    } else {
      return (this.categoria as CategoriaInsumos)?.ID_Categoria_I > 0;
    }
  }

  // Obtener el ID actual de la categoría
  get idCategoria(): number {
    if (this.tipoCategoria === 'producto') {
      return (this.categoria as CategoriaProducto).ID_Categoria_P;
    } else {
      return (this.categoria as CategoriaInsumos).ID_Categoria_I;
    }
  }

  // Obtener el tipo de categoría en español
  get tipoCategoriaTexto(): string {
    return this.tipoCategoria === 'producto' ? 'Productos' : 'Insumos';
  }

  // Obtener el icono según el tipo
  get iconoTipo(): string {
    return this.tipoCategoria === 'producto' ? 'shopping_bag' : 'inventory_2';
  }

  // Obtener el color según el tipo
  get colorTipo(): string {
    return this.tipoCategoria === 'producto' ? 'primary' : 'accent';
  }

  // 💾 Guardar categoría
  saveCategoria() {
    // Convertir nombre en Capitalizado
    if (this.categoria.Nombre) {
      this.categoria.Nombre = this.capitalizeWords(this.categoria.Nombre.trim());
    }

    if (!this.categoria.Nombre.trim()) {
      Swal.fire('Error', 'El nombre de la categoría es obligatorio', 'warning');
      return;
    }

    if (this.tipoCategoria === 'producto') {
      const cat = this.categoria as CategoriaProducto;
      if (!cat.ID_Categoria_P || cat.ID_Categoria_P === 0) {
        this.categoriaService.createCategoriaProducto(cat).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Categoría de productos creada correctamente', 'success');
            this.dialogRef.close(true);
          },
          error: () => Swal.fire('Error', 'Error al crear categoría de productos', 'error')
        });
      } else {
        this.categoriaService.updateCategoriaProducto(cat.ID_Categoria_P, cat).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Categoría de productos actualizada correctamente', 'success');
            this.dialogRef.close(true);
          },
          error: () => Swal.fire('Error', 'Error al actualizar categoría de productos', 'error')
        });
      }
    } else {
      const cat = this.categoria as CategoriaInsumos;
      if (!cat.ID_Categoria_I || cat.ID_Categoria_I === 0) {
        this.categoriaService.createCategoriaInsumo(cat).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Categoría de insumos creada correctamente', 'success');
            this.dialogRef.close(true);
          },
          error: () => Swal.fire('Error', 'Error al crear categoría de insumos', 'error')
        });
      } else {
        this.categoriaService.updateCategoriaInsumo(cat.ID_Categoria_I, cat).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Categoría de insumos actualizada correctamente', 'success');
            this.dialogRef.close(true);
          },
          error: () => Swal.fire('Error', 'Error al actualizar categoría de insumos', 'error')
        });
      }
    }
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