import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Core
import { TamanoService } from '../../../../core/services/tamano.service';
import { Tamano, TamanoDTO } from '../../../../core/models/tamano.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tamano-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './tamano-form.component.html',
  styleUrls: ['./tamano-form.component.css']
})
export class TamanoFormComponent {
  form: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private tamanoService: TamanoService,
    private dialogRef: MatDialogRef<TamanoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Tamano | null
  ) {
    this.form = this.fb.group({
      Tamano: [data?.Tamano || '', [Validators.required, Validators.minLength(2)]]
    });
  }

  saveTamano() {
    if (this.form.invalid) return;

    this.guardando = true;

    // Normalizar nombre (Capitalizar)
    const nombreRaw = this.form.get('Tamano')?.value;
    const nombreNormalizado = this.capitalizeWords(nombreRaw.trim());
    
    const payload: TamanoDTO = {
      Tamano: nombreNormalizado
    };

    if (this.data) {
      // EDITAR
      this.tamanoService.updateTamano(this.data.ID_Tamano, payload).subscribe({
        next: () => this.handleSuccess('Tamaño actualizado correctamente'),
        error: (err) => this.handleError('actualizar', err)
      });
    } else {
      // CREAR
      this.tamanoService.createTamano(payload).subscribe({
        next: () => this.handleSuccess('Tamaño registrado correctamente'),
        error: (err) => this.handleError('crear', err)
      });
    }
  }

  private handleSuccess(msg: string) {
    this.guardando = false;
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: msg,
      timer: 1500,
      showConfirmButton: false
    });
    this.dialogRef.close(true);
  }

  private handleError(action: string, err: any) {
    this.guardando = false;
    console.error(err);
    
    if (err.status === 409) {
      Swal.fire('Duplicado', 'Ya existe un tamaño con este nombre.', 'warning');
    } else {
      Swal.fire('Error', `No se pudo ${action} el tamaño.`, 'error');
    }
  }

  private capitalizeWords(text: string): string {
    return text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }

  close() {
    this.dialogRef.close(false);
  }
}