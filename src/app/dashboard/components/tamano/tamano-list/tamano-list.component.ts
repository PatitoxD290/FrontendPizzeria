import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TamanoService } from '../../../../core/services/tamano.service';
import { Tamano } from '../../../../core/models/tamano.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TamanoFormComponent } from '../tamano-form/tamano-form.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tamano-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './tamano-list.component.html',
  styleUrls: ['./tamano-list.component.css']
})
export class TamanoListComponent implements OnInit {
  tamanos: Tamano[] = [];

  constructor(private tamanoService: TamanoService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadTamanos();
  }

  loadTamanos() {
    this.tamanoService.getTamanos().subscribe({
      next: (res) => {
        this.tamanos = res.sort((a, b) => b.ID_Tamano - a.ID_Tamano);
      },
      error: (err) => console.error(err)
    });
  }

  openForm(tamano?: Tamano) {
    const dialogRef = this.dialog.open(TamanoFormComponent, {
      width: '400px',
      data: tamano || null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadTamanos();
    });
  }

  deleteTamano(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tamanoService.deleteTamano(id).subscribe({
          next: () => {
            this.loadTamanos();
            Swal.fire('Eliminado', 'El tamaño fue eliminado correctamente', 'success');
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo eliminar el tamaño', 'error');
          }
        });
      }
    });
  }
}
