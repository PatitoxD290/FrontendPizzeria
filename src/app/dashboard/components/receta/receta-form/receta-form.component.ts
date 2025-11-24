import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Modelos
import { Receta, RecetaDetalle, RecetaCreacionDTO, RecetaDetalleDTO } from '../../../../core/models/receta.model';
import { Insumo } from '../../../../core/models/insumo.model';

// Servicios
import { RecetaService } from '../../../../core/services/receta.service';
import { InsumoService } from '../../../../core/services/insumo.service'; // ⚠️ Renombrado de IngredienteService

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import Swal from 'sweetalert2';

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
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './receta-form.component.html',
  styleUrls: ['./receta-form.component.css']
})
export class RecetaFormComponent implements OnInit {

  receta: Receta;
  detalles: RecetaDetalle[] = [];
  insumos: Insumo[] = [];
  
  // Variable auxiliar para manejar el tiempo en el input (number)
  tiempoMinutos: number = 0;
  guardando = false;

  constructor(
    private recetaService: RecetaService,
    private insumoService: InsumoService,
    private dialogRef: MatDialogRef<RecetaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { receta?: Receta; detalles?: RecetaDetalle[] }
  ) {
    // 1. Inicializar Receta
    this.receta = data?.receta
      ? { ...data.receta }
      : {
          ID_Receta: 0,
          Nombre: '',
          Descripcion: '',
          Tiempo_Preparacion: ''
        };

    // 2. Convertir tiempo string ("01:30:00") a minutos (90)
    if (this.receta.Tiempo_Preparacion) {
      this.tiempoMinutos = this.timeStringToMinutes(this.receta.Tiempo_Preparacion);
    }

    // 3. Inicializar Detalles
    if (data?.detalles && data.detalles.length > 0) {
      // Clonar para edición
      this.detalles = data.detalles.map(d => ({ ...d }));
    } else {
      // Agregar una fila vacía por defecto
      this.addDetalle();
    }
  }

  ngOnInit(): void {
    this.loadInsumos();
  }

  // 📥 Cargar insumos para el select
  loadInsumos() {
    this.insumoService.getInsumos().subscribe({
      next: (data) => (this.insumos = data.filter(i => i.Estado === 'D')), // Solo disponibles
      error: (err) => console.error('Error al cargar insumos:', err)
    });
  }

  // ➕ Gestión de Detalles
  addDetalle() {
    this.detalles.push({
      ID_Receta_D: 0,
      ID_Receta: this.receta.ID_Receta || 0,
      ID_Insumo: 0,
      Cantidad: 1,
      Uso: '',
      Nombre_Insumo: '', // Visual
      Unidad_Med: ''     // Visual
    });
  }

  removeDetalle(index: number) {
    if (this.detalles.length > 1) {
      this.detalles.splice(index, 1);
    } else {
      Swal.fire('Atención', 'La receta debe tener al menos un ingrediente.', 'warning');
    }
  }

  // Al seleccionar un insumo, actualizar unidad de medida visualmente
  onInsumoChange(detalle: RecetaDetalle) {
    const insumo = this.insumos.find(i => i.ID_Insumo === detalle.ID_Insumo);
    if (insumo) {
      detalle.Nombre_Insumo = insumo.Nombre;
      detalle.Unidad_Med = insumo.Unidad_Med;
    }
  }

  // 💾 Guardar
  saveReceta() {
    // Validaciones
    if (!this.receta.Nombre?.trim()) {
      Swal.fire('Error', 'El nombre de la receta es obligatorio', 'error');
      return;
    }

    if (this.tiempoMinutos <= 0) {
      Swal.fire('Error', 'El tiempo de preparación debe ser mayor a 0 minutos', 'error');
      return;
    }

    // Validar detalles
    const detallesValidos = this.detalles.filter(d => d.ID_Insumo && d.Cantidad > 0);
    if (detallesValidos.length === 0) {
      Swal.fire('Error', 'Debes agregar al menos un ingrediente válido (con insumo y cantidad)', 'error');
      return;
    }

    // Validar duplicados
    const ids = detallesValidos.map(d => d.ID_Insumo);
    if (new Set(ids).size !== ids.length) {
      Swal.fire('Error', 'No puedes repetir el mismo ingrediente', 'error');
      return;
    }

    this.guardando = true;

    // Preparar DTO
    const detallesDTO: RecetaDetalleDTO[] = detallesValidos.map(d => ({
      ID_Insumo: d.ID_Insumo,
      Cantidad: d.Cantidad,
      Uso: d.Uso || ''
    }));

    const recetaDTO: RecetaCreacionDTO = {
      Nombre: this.receta.Nombre.trim(),
      Descripcion: this.receta.Descripcion || '',
      Tiempo_Preparacion: this.tiempoMinutos, // Enviar número (minutos)
      Detalles: detallesDTO
    };

    if (!this.receta.ID_Receta || this.receta.ID_Receta === 0) {
      // CREAR
      this.recetaService.createReceta(recetaDTO).subscribe({
        next: () => this.handleSuccess('Receta creada correctamente'),
        error: (err) => this.handleError('crear', err)
      });
    } else {
      // ACTUALIZAR
      this.recetaService.updateReceta(this.receta.ID_Receta, recetaDTO).subscribe({
        next: () => this.handleSuccess('Receta actualizada correctamente'),
        error: (err) => this.handleError('actualizar', err)
      });
    }
  }

  // 🔧 Helpers
  private timeStringToMinutes(timeString: string): number {
    if (!timeString) return 0;
    const parts = timeString.split(':');
    if (parts.length < 2) return 0;
    return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
  }

  private handleSuccess(msg: string) {
    this.guardando = false;
    Swal.fire('¡Éxito!', msg, 'success');
    this.dialogRef.close(true);
  }

  private handleError(action: string, err: any) {
    this.guardando = false;
    console.error(err);
    Swal.fire('Error', `No se pudo ${action} la receta.`, 'error');
  }

  close() {
    this.dialogRef.close(false);
  }
}