// src/app/dashboard/components/receta-form/receta-form.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Receta } from '../../../../core/models/receta.model';
import { DetalleReceta } from '../../../../core/models/detalle-receta.model';
import { Ingrediente } from '../../../../core/models/ingrediente.model';
import { RecetaService } from '../../../services/receta.service';
import { IngredienteService } from '../../../services/ingrediente.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-receta-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule
  ],
  templateUrl: './receta-form.component.html',
  styleUrls: ['./receta-form.component.css']
})
export class RecetaFormComponent implements OnInit {

  receta: Receta;
  detalles: DetalleReceta[] = [];
  ingredientes: Ingrediente[] = [];

  constructor(
    private recetaService: RecetaService,
    private ingredienteService: IngredienteService,
    private dialogRef: MatDialogRef<RecetaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { receta?: Receta, detalles?: DetalleReceta[] }
  ) {
    // ✅ Clonar los datos para evitar cambios antes de guardar
    this.receta = data?.receta
      ? { ...data.receta }
      : {
          receta_id: 0,
          nombre_receta: '',
          descripcion_receta: '',
          tiempo_estimado_minutos: undefined
        };

    this.detalles = data?.detalles
      ? data.detalles.map(det => ({ ...det }))
      : [
          {
            ingrediente_id: 0,
            cantidad_requerida: 0,
            unidad_medida: '',
            descripcion_uso: ''
          }
        ];
  }

  ngOnInit(): void {
    this.loadIngredientes();
  }

  loadIngredientes() {
    this.ingredienteService.getIngredientes().subscribe({
      next: (data) => (this.ingredientes = data),
      error: (err) => console.error('Error al cargar ingredientes', err)
    });
  }

  addDetalle() {
    this.detalles.push({
      ingrediente_id: 0,
      cantidad_requerida: 0,
      unidad_medida: '',
      descripcion_uso: ''
    });
  }

  removeDetalle(index: number) {
    this.detalles.splice(index, 1);
  }

  saveReceta() {
    const recetaConDetalles = { ...this.receta, detalles: this.detalles };

    if (!this.receta.receta_id || this.receta.receta_id === 0) {
      // Crear nueva receta con detalles
      this.recetaService.createRecetaConDetalle(recetaConDetalles).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al crear receta', err)
      });
    } else {
      // Actualizar receta existente
      this.recetaService.updateReceta(this.receta.receta_id, recetaConDetalles).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al actualizar receta', err)
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
