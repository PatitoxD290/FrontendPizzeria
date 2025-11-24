import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Models & Services
import { Tamano } from '../../../../core/models/tamano.model';
import { TamanoService } from '../../../../core/services/tamano.service';
import { TamanoFormComponent } from '../tamano-form/tamano-form.component';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-tamano-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './tamano-list.component.html',
  styleUrls: ['./tamano-list.component.css']
})
export class TamanoListComponent implements OnInit, AfterViewInit {
  
  displayedColumns: string[] = ['id', 'nombre', 'acciones'];
  dataSource = new MatTableDataSource<Tamano>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private tamanoService: TamanoService, 
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadTamanos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadTamanos() {
    this.loading = true;
    this.tamanoService.getTamanos().subscribe({
      next: (res) => {
        this.dataSource.data = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tamanos:', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los tamaños', 'error');
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openForm(tamano?: Tamano) {
    const dialogRef = this.dialog.open(TamanoFormComponent, {
      width: '450px',
      disableClose: true,
      data: tamano || null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTamanos();
      }
    });
  }

  deleteTamano(tamano: Tamano) {
    Swal.fire({
      title: '¿Eliminar tamaño?',
      text: `Se eliminará el tamaño "${tamano.Tamano}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tamanoService.deleteTamano(tamano.ID_Tamano).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El tamaño ha sido eliminado correctamente.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadTamanos();
          },
          error: (error) => {
            console.error('Error al eliminar tamaño:', error);
            
            // Manejo específico para FK constraint (Error 400/409/500 según backend)
            if (error.status === 400 || error.status === 409) {
               Swal.fire({
                title: 'No se puede eliminar',
                html: `
                  <p>El tamaño <strong>"${tamano.Tamano}"</strong> está siendo utilizado por productos activos.</p>
                  <small>Desactiva o elimina los productos asociados primero.</small>
                `,
                icon: 'warning'
              });
            } else {
              Swal.fire('Error', 'Ocurrió un error inesperado al eliminar.', 'error');
            }
          }
        });
      }
    });
  }
}