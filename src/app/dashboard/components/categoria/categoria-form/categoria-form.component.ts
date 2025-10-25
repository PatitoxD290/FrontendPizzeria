// src/app/dashboard/components/categoria-form/categoria-form.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../../../core/models/categoria.model';
import { CategoriaService } from '../../../services/categoria.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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

  categoria: Categoria;

  constructor(
    private categoriaService: CategoriaService,
    private dialogRef: MatDialogRef<CategoriaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoria?: Categoria }
  ) {
    // Si recibe datos (editar), los carga; si no, crea uno vacío
    this.categoria = data?.categoria ?? {
      categoria_id: 0,
      nombre_categoria: '',
      descripcion_categoria: ''
    };
  }

  saveCategoria() {
    if (!this.categoria.categoria_id || this.categoria.categoria_id === 0) {
      // Crear nueva categoría
      this.categoriaService.createCategoria(this.categoria).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al crear categoría', err)
      });
    } else {
      // Actualizar categoría existente
      this.categoriaService.updateCategoria(this.categoria.categoria_id, this.categoria).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al actualizar categoría', err)
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
