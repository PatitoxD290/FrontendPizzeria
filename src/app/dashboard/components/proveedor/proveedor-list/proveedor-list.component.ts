// src/app/dashboard/components/proveedor-list/proveedor-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../../core/models/proveedor.model';
import { ProveedorService } from '../../../services/proveedor.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProveedorFormComponent } from '../proveedor-form/proveedor-form.component';

@Component({
  selector: 'app-proveedor-list',
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
  templateUrl: './proveedor-list.component.html',
  styleUrls: ['./proveedor-list.component.css']
})
export class ProveedorListComponent implements OnInit {

  displayedColumns: string[] = ['proveedor_id', 'nombre_proveedor', 'ruc', 'direccion', 'telefono', 'email', 'persona_contacto', 'estado', 'fecha_registro', 'acciones'];
  proveedores: Proveedor[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private proveedorService: ProveedorService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadProveedores();
  }

  loadProveedores() {
    this.loading = true;
    this.proveedorService.getProveedores().subscribe({
      next: data => {
        this.proveedores = data;
        this.loading = false;
        setTimeout(() => { if (this.paginator) this.paginator.length = this.proveedores.length; });
      },
      error: err => { console.error('Error al cargar proveedores', err); this.loading = false; }
    });
  }

  deleteProveedor(id: number) {
    if (!confirm('¿Eliminar este proveedor?')) return;
    this.proveedorService.deleteProveedor(id).subscribe({ next: () => this.loadProveedores(), error: err => console.error(err) });
  }

  openProveedorForm(proveedor?: Proveedor) {
    const dialogRef = this.dialog.open(ProveedorFormComponent, { width: '500px', data: { proveedor } });
    dialogRef.afterClosed().subscribe(result => { if (result) this.loadProveedores(); });
  }
}
