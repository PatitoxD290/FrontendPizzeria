import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Modelos y Servicios
import { Receta } from '../../../../core/models/receta.model';
import { RecetaService } from '../../../../core/services/receta.service';
import { RecetaFormComponent } from '../receta-form/receta-form.component';
import { VerRecetaDetalleComponent } from '../ver-receta-detalle/ver-receta-detalle.component';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-receta-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule
  ],
  templateUrl: './receta-list.component.html',
  styleUrls: ['./receta-list.component.css']
})
export class RecetaListComponent implements OnInit, AfterViewInit {
  
  displayedColumns: string[] = ['ID_Receta', 'Nombre', 'Descripcion', 'Tiempo_Preparacion', 'acciones'];
  dataSource = new MatTableDataSource<Receta>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private recetaService: RecetaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadRecetas();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Filtro personalizado para buscar en nombre y descripción
    this.dataSource.filterPredicate = (data: Receta, filter: string) => {
      const searchStr = filter.toLowerCase();
      const nombre = data.Nombre?.toLowerCase() || '';
      const descripcion = data.Descripcion?.toLowerCase() || '';
      
      return nombre.includes(searchStr) || 
             descripcion.includes(searchStr);
    };
  }

  // 📥 Cargar Recetas
  loadRecetas() {
    this.loading = true;
    this.recetaService.getRecetas().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.loading = false;
        
        if (this.paginator) {
          this.paginator.firstPage();
        }
      },
      error: err => {
        console.error('Error al cargar recetas', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las recetas', 'error');
      }
    });
  }

  // 🔍 Filtro
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // 🧹 Limpiar filtros
  limpiarFiltros() {
    const input = document.querySelector('.search-input-compact') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.dataSource.filter = '';
  }

  // 🗑️ Eliminar
  deleteReceta(receta: Receta) {
    Swal.fire({
      title: '¿Eliminar receta?',
      text: `Se eliminará "${receta.Nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.recetaService.deleteReceta(receta.ID_Receta).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Receta eliminada correctamente', 'success');
            this.loadRecetas();
          },
          error: (err) => {
            console.error(err);
            if (err.status === 409) {
              Swal.fire('No se puede eliminar', 'La receta está asignada a un producto.', 'warning');
            } else {
              Swal.fire('Error', 'Ocurrió un error al eliminar.', 'error');
            }
          }
        });
      }
    });
  }

  // 📝 Abrir Formulario (Crear/Editar)
  openRecetaForm(receta?: Receta) {
    if (receta?.ID_Receta) {
      // Si es edición, cargamos los detalles primero
      this.loading = true;
      this.recetaService.getRecetaCompleta(receta.ID_Receta).subscribe({
        next: (fullData) => {
          this.loading = false;
          const dialogRef = this.dialog.open(RecetaFormComponent, {
            width: '850px',
            disableClose: true,
            data: { 
              receta: fullData.receta, 
              detalles: fullData.detalles 
            }
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadRecetas();
          });
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          Swal.fire('Error', 'No se pudieron cargar los detalles de la receta', 'error');
        }
      });
    } else {
      // Crear nueva
      const dialogRef = this.dialog.open(RecetaFormComponent, {
        width: '850px',
        disableClose: true,
        data: {}
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadRecetas();
      });
    }
  }

  // 👁️ Ver Detalles (Solo lectura)
  viewRecetaDetails(receta: Receta) {
    this.dialog.open(VerRecetaDetalleComponent, {
      width: '600px',
      data: { recetaId: receta.ID_Receta }
    });
  }

  // 🔧 Helper para información adicional de la receta
  getRecetaInfo(receta: Receta): string {
    // Usar propiedades existentes del modelo Receta
    if (receta.Tiempo_Preparacion) {
      return `Tiempo: ${receta.Tiempo_Preparacion}`;
    }
    return 'Receta básica';
  }
}