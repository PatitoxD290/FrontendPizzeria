// src/app/dashboard/components/ingrediente-list/ingrediente-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Insumo } from '../../../../core/models/ingrediente.model';
import { IngredienteService } from '../../../../core/services/ingrediente.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IngredienteFormComponent } from '../ingrediente-form/ingrediente-form.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-ingrediente-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule
  ],
  templateUrl: './ingrediente-list.component.html',
  styleUrls: ['./ingrediente-list.component.css']
})
export class IngredienteListComponent implements OnInit {

  displayedColumns: string[] = [
    'ID_Insumo',
    'Nombre',
    'Descripcion',
    'Unidad_Med',
    'ID_Categoria_I',
    'Stock_Min',
    'Stock_Max',
    'Estado',
    'Fecha_registro',
    'Acciones'
  ];

  ingredientes: Insumo[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ingredienteService: IngredienteService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadIngredientes();
  }

  // 📦 Cargar ingredientes
  loadIngredientes() {
    this.loading = true;
    this.ingredienteService.getIngredientes().subscribe({
      next: data => {
        this.ingredientes = data;
        this.loading = false;
        setTimeout(() => {
          if (this.paginator) this.paginator.length = this.ingredientes.length;
        });
      },
      error: err => {
        console.error('Error al cargar ingredientes', err);
        this.loading = false;
      }
    });
  }

  // 🗑️ Eliminar ingrediente
  deleteIngrediente(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ingredienteService.deleteIngrediente(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El ingrediente fue eliminado correctamente', 'success');
            this.loadIngredientes();
          },
          error: err => {
            console.error(err);
            Swal.fire('Error', 'No se pudo eliminar el ingrediente', 'error');
          }
        });
      }
    });
  }

  // 📝 Abrir formulario
  openIngredienteForm(ingrediente?: Insumo) {
    const dialogRef = this.dialog.open(IngredienteFormComponent, {
      width: '500px',
      data: { ingrediente }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadIngredientes();
    });
  }
}
