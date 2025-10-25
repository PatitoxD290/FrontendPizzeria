// src/app/dashboard/components/cliente-form/cliente-form.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../../../core/models/cliente.model';
import { ClienteService } from '../../../services/cliente.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.css']
})
export class ClienteFormComponent {

  cliente: Cliente;

  constructor(
    private clienteService: ClienteService,
    private dialogRef: MatDialogRef<ClienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cliente?: Cliente }
  ) {
    this.cliente = data?.cliente ?? {
      cliente_id: 0,
      nombre_completo: '',
      dni: '',
      telefono: '',
      fecha_registro: ''
    };
  }

  saveCliente() {
    // Si no existe ID, crea el cliente; si existe, actualiza
    if (!this.cliente.cliente_id || this.cliente.cliente_id === 0) {
      this.clienteService.createCliente(this.cliente).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al crear cliente', err)
      });
    } else {
      this.clienteService.updateCliente(this.cliente.cliente_id, this.cliente).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al actualizar cliente', err)
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
