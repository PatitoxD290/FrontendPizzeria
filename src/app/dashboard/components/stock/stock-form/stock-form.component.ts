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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, map, startWith } from 'rxjs';

import { StockMovimiento } from '../../../../core/models/stock.model';
import { Insumo } from '../../../../core/models/ingrediente.model';
import { StockService } from '../../../../core/services/stock.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { IngredienteService } from '../../../../core/services/ingrediente.service';

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
    MatProgressSpinnerModule,
    MatAutocompleteModule
  ]
})
export class StockFormComponent implements OnInit {
  movimientoForm: FormGroup;
  loading = false;
  loadingInsumos = false;
  tiposMovimiento = ['Entrada', 'Salida', 'Ajuste'];
  usuarioLogueado: any = null;

  // Propiedades para el autocomplete
  insumos: Insumo[] = [];
  filteredInsumos!: Observable<Insumo[]>;
  stocksDisponibles: any[] = [];
  selectedInsumo: Insumo | null = null;
  selectedStock: any = null;

  // Nueva propiedad para saber si es un movimiento desde un registro específico
  isFromSpecificRecord: boolean = false;
  stockRecord: any = null;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private ingredienteService: IngredienteService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<StockFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockFormData
  ) {
    this.movimientoForm = this.createForm();
  }

  ngOnInit() {
    // Obtener usuario logueado
    this.usuarioLogueado = this.authService.getUser();
    
    // Verificar si viene de un registro específico
    this.isFromSpecificRecord = !!this.data?.stockData;
    this.stockRecord = this.data?.stockData;

    if (this.isFromSpecificRecord) {
      // Si viene de un registro específico, cargar directamente ese stock
      this.cargarInsumoYStockEspecifico();
    } else {
      // Si es nuevo movimiento, cargar todos los insumos para búsqueda
      this.cargarInsumos();
    }

    // Configurar el filtro para el autocomplete (solo para nuevo movimiento)
    this.filteredInsumos = this.movimientoForm.get('insumoNombre')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterInsumos(value || ''))
    );
  }

  createForm(): FormGroup {
    return this.fb.group({
      insumoNombre: [''], // Campo para buscar insumo por nombre (solo para nuevo movimiento)
      ID_Stock: [null, Validators.required], // Campo oculto para ID_Stock
      Tipo_Mov: ['Entrada', Validators.required],
      Cantidad: ['', [Validators.required, Validators.min(1)]],
      Motivo: [''] // Opcional
    });
  }

  cargarInsumoYStockEspecifico() {
    this.loadingInsumos = true;
    
    // Cargar todos los insumos para obtener el nombre del insumo específico
    this.ingredienteService.getIngredientes().subscribe({
      next: (insumos) => {
        this.insumos = insumos;
        
        // Encontrar el insumo correspondiente al stock
        const insumo = this.insumos.find(i => i.ID_Insumo === this.stockRecord.ID_Insumo);
        
        if (insumo) {
          this.selectedInsumo = insumo;
          
          // Cargar los stocks disponibles para este insumo
          this.cargarStocksPorInsumo(this.stockRecord.ID_Insumo, true);
        } else {
          this.snackBar.open('No se encontró información del insumo', 'Cerrar', { duration: 3000 });
          this.loadingInsumos = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar insumos:', error);
        this.snackBar.open('Error al cargar la información del insumo', 'Cerrar', { duration: 3000 });
        this.loadingInsumos = false;
      }
    });
  }

  cargarInsumos() {
    this.loadingInsumos = true;
    this.ingredienteService.getIngredientes().subscribe({
      next: (insumos) => {
        // Cargar TODOS los insumos sin filtrar
        this.insumos = insumos;
        console.log('Insumos cargados:', this.insumos.length);
        this.loadingInsumos = false;
      },
      error: (error) => {
        console.error('Error al cargar insumos:', error);
        this.snackBar.open('Error al cargar los insumos', 'Cerrar', { duration: 3000 });
        this.loadingInsumos = false;
      }
    });
  }

  cargarStocksPorInsumo(idInsumo: number, selectSpecificStock: boolean = false) {
    this.stockService.getStockByInsumoId(idInsumo).subscribe({
      next: (stocks) => {
        // Filtrar solo stocks activos
        this.stocksDisponibles = stocks.filter(stock => stock.Estado === 'A');
        console.log('Stocks disponibles:', this.stocksDisponibles);
        
        if (this.stocksDisponibles.length === 0) {
          this.snackBar.open('No hay stock disponible para este insumo', 'Cerrar', { duration: 3000 });
          this.movimientoForm.patchValue({ ID_Stock: null });
        } else if (selectSpecificStock && this.stockRecord) {
          // Si viene de un registro específico, seleccionar automáticamente ese stock
          this.selectedStock = this.stocksDisponibles.find(stock => stock.ID_Stock === this.stockRecord.ID_Stock);
          if (this.selectedStock) {
            this.movimientoForm.patchValue({ ID_Stock: this.selectedStock.ID_Stock });
          }
        } else if (this.stocksDisponibles.length === 1) {
          // Si solo hay un stock, seleccionarlo automáticamente
          this.selectedStock = this.stocksDisponibles[0];
          this.movimientoForm.patchValue({ ID_Stock: this.selectedStock.ID_Stock });
        } else {
          // Si hay múltiples stocks, el usuario deberá seleccionar uno
          this.movimientoForm.patchValue({ ID_Stock: null });
        }
        
        this.loadingInsumos = false;
      },
      error: (error) => {
        console.error('Error al cargar stocks:', error);
        this.snackBar.open('Error al cargar el stock del insumo', 'Cerrar', { duration: 3000 });
        this.loadingInsumos = false;
      }
    });
  }

  private _filterInsumos(value: string): Insumo[] {
    const filterValue = value.toLowerCase();
    return this.insumos.filter(insumo => 
      insumo.Nombre.toLowerCase().includes(filterValue) ||
      (insumo.Descripcion && insumo.Descripcion.toLowerCase().includes(filterValue))
    );
  }

  onInsumoSelected(event: any) {
    const insumoNombre = event.option.value;
    this.selectedInsumo = this.insumos.find(insumo => insumo.Nombre === insumoNombre) || null;
    
    if (this.selectedInsumo) {
      console.log('Insumo seleccionado:', this.selectedInsumo);
      // Cargar los stocks disponibles para este insumo
      this.cargarStocksPorInsumo(this.selectedInsumo.ID_Insumo);
    } else {
      this.stocksDisponibles = [];
      this.movimientoForm.patchValue({ ID_Stock: null });
    }
  }

  onStockSelected(event: any) {
    const stockId = event.value;
    this.selectedStock = this.stocksDisponibles.find(stock => stock.ID_Stock === stockId) || null;
  }

  displayInsumoFn(insumo: Insumo): string {
    return insumo && insumo.Nombre ? insumo.Nombre : '';
  }

  onSubmit() {
    if (this.movimientoForm.valid) {
      this.loading = true;
      
      // Preparar datos del movimiento
      const movimientoData = {
        ID_Stock: this.movimientoForm.value.ID_Stock,
        Tipo_Mov: this.movimientoForm.value.Tipo_Mov,
        Cantidad: this.movimientoForm.value.Cantidad,
        Motivo: this.movimientoForm.value.Motivo?.trim() || null
      };

      console.log('Enviando movimiento:', movimientoData);

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

  // Método para obtener la clase CSS según el estado del insumo
  getEstadoInsumoClass(): string {
    if (!this.selectedInsumo) return '';
    
    switch (this.selectedInsumo.Estado) {
      case 'D': return 'estado-disponible'; // D = Disponible
      case 'A': return 'estado-agotado';    // A = Agotado
      default: return '';
    }
  }

  // Método para obtener el texto del estado del insumo
  getEstadoInsumoText(): string {
    if (!this.selectedInsumo) return '';
    
    switch (this.selectedInsumo.Estado) {
      case 'D': return 'Disponible';
      case 'A': return 'Agotado';
      default: return 'Desconocido';
    }
  }
}