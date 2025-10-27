// src/app/dashboard/components/receta-list/receta-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Receta } from '../../../../core/models/receta.model';
import { RecetaService } from '../../../../core/services/auth/receta.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RecetaFormComponent } from '../receta-form/receta-form.component';

@Component({
  selector: 'app-receta-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule
  ],
  templateUrl: './receta-list.component.html',
  styleUrls: ['./receta-list.component.css']
})
export class RecetaListComponent implements OnInit {
  displayedColumns: string[] = ['receta_id', 'nombre_receta', 'descripcion_receta', 'tiempo_estimado_minutos', 'acciones'];
  recetas: Receta[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private recetaService: RecetaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadRecetas();
  }

  loadRecetas() {
    this.loading = true;
    this.recetaService.getRecetas().subscribe({
      next: data => {
        this.recetas = data;
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar recetas', err);
        this.loading = false;
      }
    });
  }

  deleteReceta(id: number) {
    if (!confirm('¿Eliminar esta receta?')) return;
    this.recetaService.deleteReceta(id).subscribe({
      next: () => this.loadRecetas(),
      error: err => console.error('Error al eliminar receta', err)
    });
  }

  openRecetaForm(receta?: Receta) {
  if (receta?.receta_id) {
    this.recetaService.getDetallesPorReceta(receta.receta_id).subscribe({
      next: (detalles) => {
        const dialogRef = this.dialog.open(RecetaFormComponent, {
          width: '700px',
          data: { receta, detalles }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) this.loadRecetas();
        });
      },
      error: (err) => console.error('Error al cargar detalles', err)
    });
  } else {
    const dialogRef = this.dialog.open(RecetaFormComponent, {
      width: '700px',
      data: {}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadRecetas();
    });
  }
}

}
