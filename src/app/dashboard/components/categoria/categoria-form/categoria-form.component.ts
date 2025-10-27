// src/app/dashboard/components/categoria-form/categoria-form.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria_P } from '../../../../core/models/categoria.model';
import { CategoriaService } from '../../../../core/services/auth/categoria.service';

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

  categoria: Categoria_P;

  constructor(
  private categoriaService: CategoriaService,
  private dialogRef: MatDialogRef<CategoriaFormComponent>,
  @Inject(MAT_DIALOG_DATA) public data: { categoria?: Categoria_P }
    ) {
      // Clonar el objeto para evitar modificar el original si se cancela
      this.categoria = data?.categoria
        ? { ...data.categoria }  // 🔹 clonamos con spread operator
        : {
            categoria_id: 0,
            nombre_categoria: ''
          };
    }


saveCategoria() {
  if (!this.categoria.nombre_categoria.trim()) {
    Swal.fire('Error', 'El nombre de la categoría es obligatorio', 'warning');
    return;
  }

  if (!this.categoria.categoria_id || this.categoria.categoria_id === 0) {
    // Crear nueva categoría
    this.categoriaService.createCategoria(this.categoria).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Categoría creada correctamente', 'success');
        this.dialogRef.close(true);
      },
      error: (err) => Swal.fire('Error', 'Error al crear categoría', 'error')
    });
  } else {
    // Actualizar categoría existente
    this.categoriaService.updateCategoria(this.categoria.categoria_id, this.categoria).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Categoría actualizada correctamente', 'success');
        this.dialogRef.close(true);
      },
      error: (err) => Swal.fire('Error', 'Error al actualizar categoría', 'error')
    });
  }
}



  close() {
    this.dialogRef.close(false);
  }
}
