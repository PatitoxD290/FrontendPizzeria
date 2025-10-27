import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../../../core/models/cliente.model';
import { ClienteService } from '../../../../core/services/auth/cliente.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import Swal from 'sweetalert2';

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
    this.cliente = data?.cliente
      ? { ...data.cliente }
      : {
          id_cliente: 0,
          nombre: '',
          apellido: '',
          dni: '',
          telefono: '',
          fecha_registro: ''
        };
  }

  async saveCliente() {
    // 🔸 Validar nombre obligatorio
    if (!this.cliente.nombre?.trim()) {
      Swal.fire('Campo requerido', 'El nombre completo es obligatorio', 'warning');
      return;
    }

    // 🔸 Validar DNI solo si fue ingresado
    if (this.cliente.dni && this.cliente.dni.trim() !== '') {
      if (this.cliente.dni.length !== 8) {
        Swal.fire('DNI inválido', 'El DNI debe tener 8 dígitos', 'error');
        return;
      }

      // 🔸 Verificar si el DNI ya existe
      const existe = await this.verificarDniExistente(this.cliente.dni, this.cliente.id_cliente);
      if (existe) {
        Swal.fire('DNI duplicado', 'Ya existe un cliente con ese DNI', 'error');
        return;
      }
    }

    // 🔸 Crear cliente
    if (!this.cliente.id_cliente || this.cliente.id_cliente === 0) {
      this.clienteService.createCliente(this.cliente).subscribe({
        next: () => {
          Swal.fire('¡Registrado!', 'Cliente agregado correctamente', 'success');
          this.dialogRef.close(true);
        },
        error: () => {
          Swal.fire('Error', 'No se pudo registrar el cliente', 'error');
        }
      });
    } 
    // 🔸 Actualizar cliente
    else {
      this.clienteService.updateCliente(this.cliente.id_cliente, this.cliente).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'Cliente actualizado correctamente', 'success');
          this.dialogRef.close(true);
        },
        error: () => {
          Swal.fire('Error', 'No se pudo actualizar el cliente', 'error');
        }
      });
    }
  }

  // 🔍 Método auxiliar para validar si el DNI ya existe
  async verificarDniExistente(dni: string, cliente_id?: number): Promise<boolean> {
    return new Promise((resolve) => {
      this.clienteService.getClientes().subscribe({
        next: (clientes) => {
          const duplicado = clientes.some(
            (c) => c.dni && c.dni === dni && c.id_cliente !== cliente_id
          );
          resolve(duplicado);
        },
        error: () => resolve(false)
      });
    });
  }

  close() {
    this.dialogRef.close(false);
  }
}
