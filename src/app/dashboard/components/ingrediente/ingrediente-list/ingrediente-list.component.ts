// src/app/dashboard/components/ingrediente-list/ingrediente-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ingrediente } from '../../../../core/models/ingrediente.model';
import { IngredienteService } from '../../../services/ingrediente.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IngredienteFormComponent } from '../ingrediente-form/ingrediente-form.component';

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
    'ingrediente_id',
    'nombre_ingrediente',
    'descripcion_ingrediente',
    'unidad_medida',
    'categoria_ingrediente',
    'stock_minimo',
    'stock_maximo',
    'estado',
    'fecha_registro',
    'acciones'
  ];

  ingredientes: Ingrediente[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private ingredienteService: IngredienteService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadIngredientes();
  }

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

  deleteIngrediente(id: number) {
    if (!confirm('¿Deseas eliminar este ingrediente?')) return;
    this.ingredienteService.deleteIngrediente(id).subscribe({
      next: () => this.loadIngredientes(),
      error: err => console.error(err)
    });
  }

  openIngredienteForm(ingrediente?: Ingrediente) {
    const dialogRef = this.dialog.open(IngredienteFormComponent, {
      width: '500px',
      data: { ingrediente }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadIngredientes();
    });
  }
}
