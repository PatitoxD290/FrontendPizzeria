import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente, ClienteDTO } from '../../../../core/models/cliente.model';
import { ClienteService } from '../../../../core/services/cliente.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

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
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.css']
})
export class ClienteFormComponent {
  
  // Objeto local para el formulario (compatible con el modelo)
  cliente: {
    ID_Cliente: number;
    Nombre: string;
    Apellido: string;
    Numero_Documento: string;
    Telefono: string;
    ID_Tipo_Doc?: number | null;
  };

  constructor(
    private clienteService: ClienteService,
    private dialogRef: MatDialogRef<ClienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cliente?: Cliente }
  ) {
    // Inicializar datos: Si viene para editar (data.cliente), copiamos. Si no, vacíos.
    this.cliente = data?.cliente
      ? { 
          ID_Cliente: data.cliente.ID_Cliente,
          Nombre: data.cliente.Nombre,
          Apellido: data.cliente.Apellido,
          Numero_Documento: data.cliente.Numero_Documento, // 🟢 Campo actualizado
          Telefono: data.cliente.Telefono,
          ID_Tipo_Doc: data.cliente.ID_Tipo_Doc
        }
      : {
          ID_Cliente: 0,
          Nombre: '',
          Apellido: '',
          Numero_Documento: '',
          Telefono: '',
          ID_Tipo_Doc: null
        };
  }

  async saveCliente() {
    // 1. Validar nombre obligatorio
    if (!this.cliente.Nombre?.trim()) {
      Swal.fire('Campo requerido', 'El nombre es obligatorio', 'warning');
      return;
    }

    // 2. Validar Documento (si fue ingresado)
    if (this.cliente.Numero_Documento && this.cliente.Numero_Documento.trim() !== '') {
      const doc = this.cliente.Numero_Documento.trim();
      
      // Validar longitud (8 para DNI, 11 para RUC)
      if (doc.length !== 8 && doc.length !== 11) {
        Swal.fire('Documento inválido', 'El documento debe tener 8 (DNI) u 11 (RUC) dígitos', 'error');
        return;
      }

      // Validar duplicado en BD (Front check)
      const existe = await this.verificarDocumentoExistente(doc, this.cliente.ID_Cliente);
      if (existe) {
        Swal.fire('Duplicado', 'Ya existe un cliente con ese número de documento', 'error');
        return;
      }
    }

    // 3. Preparar DTO para enviar al backend
    const clienteDTO: ClienteDTO = {
      Nombre: this.cliente.Nombre,
      Apellido: this.cliente.Apellido,
      Numero_Documento: this.cliente.Numero_Documento,
      Telefono: this.cliente.Telefono,
      ID_Tipo_Doc: this.cliente.ID_Tipo_Doc // El backend puede inferirlo si es null
    };

    // 4. Guardar
    if (!this.cliente.ID_Cliente || this.cliente.ID_Cliente === 0) {
      // CREAR
      this.clienteService.createCliente(clienteDTO).subscribe({
        next: () => {
          Swal.fire('¡Registrado!', 'Cliente agregado correctamente', 'success');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo registrar el cliente', 'error');
        }
      });
    } else {
      // ACTUALIZAR
      this.clienteService.updateCliente(this.cliente.ID_Cliente, clienteDTO).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'Cliente actualizado correctamente', 'success');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo actualizar el cliente', 'error');
        }
      });
    }
  }

  // 🔍 Método auxiliar para validar si el documento ya existe
  async verificarDocumentoExistente(doc: string, cliente_id?: number): Promise<boolean> {
    return new Promise((resolve) => {
      this.clienteService.getClientes().subscribe({
        next: (clientes) => {
          const duplicado = clientes.some(
            (c) => c.Numero_Documento === doc && c.ID_Cliente !== cliente_id
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