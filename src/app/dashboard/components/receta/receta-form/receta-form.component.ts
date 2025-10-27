// src/app/dashboard/components/receta-form/receta-form.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Receta, RecetaDetalle } from '../../../../core/models/receta.model';
import { Insumo } from '../../../../core/models/ingrediente.model';
import { RecetaService } from '../../../../core/services/receta.service';
import { IngredienteService } from '../../../../core/services/ingrediente.service';

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
  detalles: RecetaDetalle[] = [];
  ingredientes: Insumo[] = [];

  constructor(
    private recetaService: RecetaService,
    private ingredienteService: IngredienteService,
    private dialogRef: MatDialogRef<RecetaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { receta?: Receta; detalles?: RecetaDetalle[] }
  ) {
    // ✅ Inicializar receta
    this.receta = data?.receta
      ? { ...data.receta }
      : {
          id_receta: 0,
          Nombre: '',
          Descripcion: '',
          Tiempo_preparacion: ''
        };

    // ✅ Clonar detalles si existen, o crear uno vacío
    this.detalles = data?.detalles
      ? data.detalles.map(det => ({ ...det }))
      : [
          {
            id_receta_d: 0,
            id_receta: 0,
            id_insumo: 0,
            cantidad: 0,
            uso: ''
          }
        ];
  }

  ngOnInit(): void {
    this.loadIngredientes();
  }

  // 🔹 Cargar ingredientes disponibles
  loadIngredientes() {
    this.ingredienteService.getIngredientes().subscribe({
      next: (data) => (this.ingredientes = data),
      error: (err) => console.error('Error al cargar ingredientes:', err)
    });
  }

  // 🔹 Agregar un nuevo detalle
  addDetalle() {
    this.detalles.push({
      id_receta_d: 0,
      id_receta: this.receta.id_receta || 0,
      id_insumo: 0,
      cantidad: 0,
      uso: ''
    });
  }

  // 🔹 Quitar un detalle
  removeDetalle(index: number) {
    this.detalles.splice(index, 1);
  }

  // 🔹 Guardar receta (crear o actualizar)
  saveReceta() {
    if (!this.receta.Nombre?.trim()) {
      console.warn('⚠️ Debes ingresar un nombre para la receta');
      return;
    }

    if (this.detalles.length === 0) {
      console.warn('⚠️ Debes agregar al menos un detalle de receta');
      return;
    }

    const recetaConDetalles = {
      nombre: this.receta.Nombre,
      descripcion: this.receta.Descripcion,
      tiempo_preparacion: this.receta.Tiempo_preparacion,
      detalles: this.detalles
    };

    if (!this.receta.id_receta || this.receta.id_receta === 0) {
      // 🟩 Crear nueva receta
      this.recetaService.createRecetaConDetalle(recetaConDetalles).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al crear receta', err)
      });
    } else {
      // 🟦 Actualizar receta existente
      this.recetaService.updateReceta(this.receta.id_receta, recetaConDetalles).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al actualizar receta', err)
      });
    }
  }

  // 🔹 Cerrar sin guardar
  close() {
    this.dialogRef.close(false);
  }
}
