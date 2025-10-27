import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Insumo } from '../../../../core/models/ingrediente.model';
import { IngredienteService } from '../../../../core/services/ingrediente.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

import Swal from 'sweetalert2';

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
export class IngredienteFormComponent implements OnInit {

  ingrediente: Insumo;

  constructor(
    private ingredienteService: IngredienteService,
    private dialogRef: MatDialogRef<IngredienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ingrediente?: Insumo }
  ) {
    // Si viene un ingrediente para editar, lo clonamos
    this.ingrediente = data?.ingrediente
      ? { ...data.ingrediente }
      : {
          id_insumo: 0,
          nombre: '',
          descripcion: '',
          unidad_med: '',
          id_categoria_i: 0,
          stock_min: 0,
          stock_max: 0,
          estado: 'A',
          fecha_registro: ''
        };
  }

  ngOnInit(): void {}

  // 💾 Guardar ingrediente
  saveIngrediente() {
    if (!this.ingrediente.nombre.trim()) {
      Swal.fire('Error', 'El nombre del ingrediente es obligatorio', 'warning');
      return;
    }

    if (this.ingrediente.id_insumo === 0) {
      // Crear nuevo
      this.ingredienteService.createIngrediente(this.ingrediente).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Ingrediente creado correctamente', 'success');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al crear ingrediente', err);
          Swal.fire('Error', 'No se pudo crear el ingrediente', 'error');
        }
      });
    } else {
      // Actualizar existente
      this.ingredienteService.updateIngrediente(this.ingrediente.id_insumo, this.ingrediente).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Ingrediente actualizado correctamente', 'success');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al actualizar ingrediente', err);
          Swal.fire('Error', 'No se pudo actualizar el ingrediente', 'error');
        }
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
