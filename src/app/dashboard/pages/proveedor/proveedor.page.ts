// src/app/dashboard/pages/proveedor/proveedor.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ProveedorFormComponent } from '../../components/proveedor/proveedor-form/proveedor-form.component';
import { ProveedorListComponent } from '../../components/proveedor/proveedor-list/proveedor-list.component';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, ProveedorListComponent],
  templateUrl: './proveedor.page.html',
  styleUrls: ['./proveedor.page.css']
})
export class ProveedorPage {
  constructor(private dialog: MatDialog) {}

  openNuevoProveedor(proveedorList: ProveedorListComponent) {
    const dialogRef = this.dialog.open(ProveedorFormComponent, { width: '500px', data: {} });
    dialogRef.afterClosed().subscribe(result => { if (result) proveedorList.loadProveedores(); });
  }
}
