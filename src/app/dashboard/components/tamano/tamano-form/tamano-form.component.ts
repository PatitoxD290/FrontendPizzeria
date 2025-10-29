import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TamanoService } from '../../../../core/services/tamano.service';
import { Tamano } from '../../../../core/models/tamano.model';
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
    MatButtonModule
  ],
  templateUrl: './tamano-form.component.html',
  styleUrls: ['./tamano-form.component.css']
})
export class TamanoFormComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tamanoService: TamanoService,
    private dialogRef: MatDialogRef<TamanoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Tamano | null
  ) {
    this.form = this.fb.group({
      Tamano: [data?.Tamano || '', Validators.required],
      Variacion_Precio: [data?.Variacion_Precio || 0, [Validators.required, Validators.min(0)]]
    });
  }

  submit() {
    if (this.form.invalid) return;

    const payload = this.form.value;

    if (this.data) {
      // Editar
      this.tamanoService.updateTamano(this.data.ID_Tamano, payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'El tamaño fue actualizado correctamente',
            timer: 1500,
            showConfirmButton: false
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo actualizar el tamaño', 'error');
        }
      });
    } else {
      // Crear
      this.tamanoService.createTamano(payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Creado',
            text: 'El tamaño fue registrado correctamente',
            timer: 1500,
            showConfirmButton: false
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo crear el tamaño', 'error');
        }
      });
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
