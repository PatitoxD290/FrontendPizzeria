import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Agregar esto
import { StockMovimiento } from '../../../../core/models/stock.model';
import { StockService } from '../../../../core/services/stock.service';

export interface StockFormData {
  ID_Stock: number;
  stockData?: any;
}

@Component({
  selector: 'app-stock-form',
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule // Agregar esto
  ]
})
export class StockFormComponent implements OnInit {
  movimientoForm: FormGroup;
  loading = false;
  tiposMovimiento = ['Entrada', 'Salida', 'Ajuste'];

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<StockFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockFormData
  ) {
    this.movimientoForm = this.createForm();
  }

  ngOnInit() {
    if (this.data) {
      this.movimientoForm.patchValue({
        ID_Stock: this.data.ID_Stock
      });
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      ID_Stock: [this.data?.ID_Stock || '', [Validators.required, Validators.min(1)]],
      Tipo_Mov: ['Entrada', Validators.required],
      Cantidad: ['', [Validators.required, Validators.min(1)]],
      Motivo: ['', Validators.required],
      Usuario_ID: [null]
    });
  }

  onSubmit() {
    if (this.movimientoForm.valid) {
      this.loading = true;
      const movimientoData = this.movimientoForm.value;

      this.stockService.registrarMovimiento(movimientoData).subscribe({
        next: (response) => {
          this.snackBar.open('Movimiento registrado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al registrar movimiento:', error);
          this.snackBar.open(
            error.error?.error || 'Error al registrar el movimiento', 
            'Cerrar', 
            { duration: 5000 }
          );
          this.loading = false;
        }
      });
    } else {
      this.movimientoForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  get formControls() {
    return this.movimientoForm.controls;
  }
}