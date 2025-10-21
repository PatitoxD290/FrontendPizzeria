// src/app/dashboard/components/receta-form/receta-form.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Receta } from '../../../../core/models/receta.model';
import { RecetaService } from '../../../services/receta.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-receta-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './receta-form.component.html',
  styleUrls: ['./receta-form.component.css']
})
export class RecetaFormComponent {

  receta: Receta;

  constructor(
    private recetaService: RecetaService,
    private dialogRef: MatDialogRef<RecetaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { receta?: Receta }
  ) {
    // Si viene una receta (editar), la usa. Si no, inicializa una nueva.
    this.receta = data?.receta ?? {
      receta_id: 0,
      nombre_receta: '',
      descripcion_receta: '',
      tiempo_estimado_minutos: undefined
    };
  }

  saveReceta() {
    if (!this.receta.receta_id || this.receta.receta_id === 0) {
      // Crear nueva receta
      this.recetaService.createReceta(this.receta).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al crear receta', err)
      });
    } else {
      // Actualizar receta existente
      this.recetaService.updateReceta(this.receta.receta_id, this.receta).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al actualizar receta', err)
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
