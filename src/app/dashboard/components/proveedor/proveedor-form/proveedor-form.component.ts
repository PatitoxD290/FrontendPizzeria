// src/app/dashboard/components/proveedor-form/proveedor-form.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Proveedor } from '../../../../core/models/proveedor.model';
import { ProveedorService } from '../../../services/proveedor.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';


@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,  
    MatOptionModule 
  ],
  templateUrl: './proveedor-form.component.html',
  styleUrls: ['./proveedor-form.component.css']
})
export class ProveedorFormComponent {

  proveedor: Proveedor;

constructor(
  private proveedorService: ProveedorService,
  private dialogRef: MatDialogRef<ProveedorFormComponent>,
  @Inject(MAT_DIALOG_DATA) public data: { proveedor?: Proveedor }
) {
  // Crear una copia del proveedor para no modificar el original hasta guardar
  this.proveedor = data?.proveedor
    ? { ...data.proveedor }
    : {
        proveedor_id: 0,
        nombre_proveedor: '',
        ruc: '',
        direccion: '',
        telefono: '',
        email: '',
        persona_contacto: '',
        estado: 'A',
        fecha_registro: ''
      };
}


  saveProveedor() {
    if (!this.proveedor.proveedor_id || this.proveedor.proveedor_id === 0) {
      this.proveedorService.createProveedor(this.proveedor).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al crear proveedor', err)
      });
    } else {
      this.proveedorService.updateProveedor(this.proveedor.proveedor_id, this.proveedor).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al actualizar proveedor', err)
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
