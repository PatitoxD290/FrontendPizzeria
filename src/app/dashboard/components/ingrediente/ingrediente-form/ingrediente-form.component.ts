// src/app/dashboard/components/ingrediente-form/ingrediente-form.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ingrediente } from '../../../../core/models/ingrediente.model';
import { IngredienteService } from '../../../services/ingrediente.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-ingrediente-form',
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
  templateUrl: './ingrediente-form.component.html',
  styleUrls: ['./ingrediente-form.component.css']
})
export class IngredienteFormComponent {

  ingrediente: Ingrediente;

  constructor(
    private ingredienteService: IngredienteService,
    private dialogRef: MatDialogRef<IngredienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ingrediente?: Ingrediente }
  ) {
    // Crear una copia del ingrediente o inicializar uno nuevo
    this.ingrediente = data?.ingrediente
      ? { ...data.ingrediente }
      : {
          ingrediente_id: 0,
          nombre_ingrediente: '',
          descripcion_ingrediente: '',
          unidad_medida: '',
          categoria_ingrediente: '',
          stock_minimo: 0,
          stock_maximo: 0,
          estado: 'A',
          fecha_registro: ''
        };
  }

  saveIngrediente() {
    if (!this.ingrediente.ingrediente_id || this.ingrediente.ingrediente_id === 0) {
      // Crear nuevo ingrediente
      this.ingredienteService.createIngrediente(this.ingrediente).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al crear ingrediente', err)
      });
    } else {
      // Actualizar ingrediente existente
      this.ingredienteService.updateIngrediente(this.ingrediente.ingrediente_id, this.ingrediente).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al actualizar ingrediente', err)
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
