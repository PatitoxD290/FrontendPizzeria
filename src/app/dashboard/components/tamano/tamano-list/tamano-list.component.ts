import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TamanoService } from '../../../../core/services/tamano.service';
import { Tamano } from '../../../../core/models/tamano.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TamanoFormComponent } from '../tamano-form/tamano-form.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tamano-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule
  ],
  templateUrl: './tamano-list.component.html',
  styleUrls: ['./tamano-list.component.css']
})
export class TamanoListComponent implements OnInit {
  tamanos: Tamano[] = [];
  paginatedTamanos: Tamano[] = [];
  
  // Configuración de paginación
  pageSize = 5;
  pageSizeOptions = [5, 10, 25, 50];
  currentPage = 0;
  totalItems = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private tamanoService: TamanoService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadTamanos();
  }

  loadTamanos() {
    this.tamanoService.getTamanos().subscribe({
      next: (res) => {
        this.tamanos = res.sort((a, b) => b.ID_Tamano - a.ID_Tamano);
        this.totalItems = this.tamanos.length;
        this.updatePaginatedData();
      },
      error: (err) => console.error(err)
    });
  }

  updatePaginatedData() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedTamanos = this.tamanos.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  openForm(tamano?: Tamano) {
    const dialogRef = this.dialog.open(TamanoFormComponent, {
      width: '400px',
      data: tamano || null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTamanos();
        // Resetear a la primera página después de agregar/editar
        if (this.paginator) {
          this.paginator.firstPage();
        }
      }
    });
  }

deleteTamano(tamano: Tamano) {
  Swal.fire({
    title: '¿Estás seguro?',
    text: `Vas a eliminar el tamaño "${tamano.Tamano}"`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.tamanoService.deleteTamano(tamano.ID_Tamano).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Eliminado!',
            text: `El tamaño "${tamano.Tamano}" ha sido eliminado correctamente.`,
            icon: 'success',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          });
          this.loadTamanos();
        },
        error: (error) => {
          console.error('Error al eliminar tamaño:', error);
          
          // Verificar si es error de productos asociados
          if (error.status === 400 && error.error?.error) {
            const errorMessage = error.error.error;
            
            if (errorMessage.includes('productos asociados') || errorMessage.includes('siendo utilizado')) {
              Swal.fire({
                title: 'No se puede eliminar',
                html: `
                  <div style="text-align: left;">
                    <p><strong>El tamaño "${tamano.Tamano}" no puede ser eliminado porque tiene productos asociados.</strong></p>
                    <p style="margin-top: 10px; font-size: 14px; color: #666;">
                      Este tamaño está siendo utilizado por productos en el sistema. Para eliminarlo, primero debes:
                    </p>
                    <ul style="text-align: left; margin: 10px 0; padding-left: 20px; font-size: 14px; color: #666;">
                      <li>Eliminar los productos que usan este tamaño</li>
                      <li>O cambiar el tamaño de los productos asociados</li>
                    </ul>
                  </div>
                `,
                icon: 'warning',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#3085d6',
                width: 500
              });
            } else {
              // Otro error 400
              Swal.fire('Error', errorMessage, 'error');
            }
          } else {
            // Error genérico del servidor
            Swal.fire({
              title: 'Error del servidor',
              text: 'Ocurrió un error inesperado. Por favor, intente nuevamente.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        }
      });
    }
  });
}
}