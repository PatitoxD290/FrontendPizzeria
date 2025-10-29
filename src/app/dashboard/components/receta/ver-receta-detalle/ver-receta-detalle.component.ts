// src/app/dashboard/components/ver-receta-detalle/ver-receta-detalle.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RecetaService } from '../../../../core/services/receta.service';
import { RecetaDetalle } from '../../../../core/models/receta.model';

@Component({
  selector: 'app-ver-receta-detalle',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './ver-receta-detalle.component.html',
  styleUrls: ['./ver-receta-detalle.component.css']
})
export class VerRecetaDetalleComponent implements OnInit {
  recetaNombre: string = '';
  recetaDescripcion: string = '';
  recetaTiempo: string = '';
  detalles: RecetaDetalle[] = [];
  loading = true;
  error = '';

  constructor(
    private recetaService: RecetaService,
    private dialogRef: MatDialogRef<VerRecetaDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { recetaId: number }
  ) {}

  ngOnInit(): void {
    this.cargarReceta();
  }

  private cargarReceta(): void {
    this.recetaService.getRecetaDetalle(this.data.recetaId).subscribe({
      next: (res) => {
        this.recetaNombre = res.receta.Nombre;
        this.recetaDescripcion = res.receta.Descripcion || '';
        this.recetaTiempo = res.receta.Tiempo_Preparacion || '';
        this.detalles = res.detalles || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar la receta:', err);
        this.error = 'No se pudieron cargar los detalles de la receta.';
        this.loading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
