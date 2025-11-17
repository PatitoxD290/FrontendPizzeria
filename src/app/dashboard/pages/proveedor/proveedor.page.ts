import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProveedorListComponent } from '../../components/proveedor/proveedor-list/proveedor-list.component';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [CommonModule, ProveedorListComponent],
  templateUrl: './proveedor.page.html',
  styleUrls: ['./proveedor.page.css']
})
export class ProveedorPage {}
