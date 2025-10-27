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
    MatInputModule
  ],
  templateUrl: './categoria-form.component.html',
  styleUrls: ['./categoria-form.component.css']
})
export class CategoriaFormComponent {

  tipoCategoria: 'producto' | 'insumo' = 'producto';
  categoria: CategoriaProducto | CategoriaInsumos;

  constructor(
    private categoriaService: CategoriaService,
    private dialogRef: MatDialogRef<CategoriaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoria?: CategoriaProducto | CategoriaInsumos, tipo?: 'producto' | 'insumo' }
  ) {
    // Tipo inicial (si viene desde el diálogo)
    this.tipoCategoria = data?.tipo || 'producto';

    // Crear una nueva categoría o clonar la existente
    if (this.tipoCategoria === 'producto') {
      this.categoria = data?.categoria
        ? { ...(data.categoria as CategoriaProducto) }
        : { id_categoria_p: 0, nombre: '' };
    } else {
      this.categoria = data?.categoria
        ? { ...(data.categoria as CategoriaInsumos) }
        : { id_categoria_i: 0, nombre: '' };
    }
  }

  // 🔁 Alternar entre tipo de categoría
  toggleTipo() {
    if (this.tipoCategoria === 'producto') {
      this.tipoCategoria = 'insumo';
      this.categoria = { id_categoria_i: 0, nombre: '' };
    } else {
      this.tipoCategoria = 'producto';
      this.categoria = { id_categoria_p: 0, nombre: '' };
    }
  }

  // 🧠 Getter para saber si estamos editando o creando
  get esEdicion(): boolean {
    if (this.tipoCategoria === 'producto') {
      return (this.categoria as CategoriaProducto)?.id_categoria_p > 0;
    } else {
      return (this.categoria as CategoriaInsumos)?.id_categoria_i > 0;
    }
  }

  // 💾 Guardar categoría
  saveCategoria() {
    if (!this.categoria.nombre.trim()) {
      Swal.fire('Error', 'El nombre de la categoría es obligatorio', 'warning');
      return;
    }

    if (this.tipoCategoria === 'producto') {
      const cat = this.categoria as CategoriaProducto;
      if (!cat.id_categoria_p || cat.id_categoria_p === 0) {
        this.categoriaService.createCategoriaProducto(cat).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Categoría de producto creada correctamente', 'success');
            this.dialogRef.close(true);
          },
          error: () => Swal.fire('Error', 'Error al crear categoría de producto', 'error')
        });
      } else {
        this.categoriaService.updateCategoriaProducto(cat.id_categoria_p, cat).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Categoría de producto actualizada correctamente', 'success');
            this.dialogRef.close(true);
          },
          error: () => Swal.fire('Error', 'Error al actualizar categoría de producto', 'error')
        });
      }
    } else {
      const cat = this.categoria as CategoriaInsumos;
      if (!cat.id_categoria_i || cat.id_categoria_i === 0) {
        this.categoriaService.createCategoriaInsumo(cat).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Categoría de insumo creada correctamente', 'success');
            this.dialogRef.close(true);
          },
          error: () => Swal.fire('Error', 'Error al crear categoría de insumo', 'error')
        });
      } else {
        this.categoriaService.updateCategoriaInsumo(cat.id_categoria_i, cat).subscribe({
          next: () => {
            Swal.fire('¡Éxito!', 'Categoría de insumo actualizada correctamente', 'success');
            this.dialogRef.close(true);
          },
          error: () => Swal.fire('Error', 'Error al actualizar categoría de insumo', 'error')
        });
      }
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
