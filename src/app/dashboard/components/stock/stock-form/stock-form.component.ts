import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Modelos
import { Stock, StockMovimientoDTO } from '../../../../core/models/stock.model';
import { Insumo } from '../../../../core/models/insumo.model';

// Servicios
import { StockService } from '../../../../core/services/stock.service';
import { InsumoService } from '../../../../core/services/insumo.service'; // ⚠️ Antes IngredienteService
import { AuthService } from '../../../../core/services/auth/auth.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Swal from 'sweetalert2';

export interface StockFormData {
  // Si venimos desde un lote específico (ej: botón "Movimiento" en la fila de stock)
  stockData?: Stock; 
}

@Component({
  selector: 'app-stock-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule
  ],
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.css'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
})
export class StockFormComponent implements OnInit {
  
  movimientoForm: FormGroup;
  loading = false;
  loadingInsumos = false;
  
  tiposMovimiento = ['Entrada', 'Salida', 'Ajuste'];
  usuarioLogueado: any = null;

  // Autocomplete Insumos
  insumos: Insumo[] = [];
  filteredInsumos!: Observable<Insumo[]>;
  
  // Lotes de stock disponibles para el insumo seleccionado
  stocksDisponibles: Stock[] = [];
  
  selectedInsumo: Insumo | null = null;
  selectedStock: Stock | null = null;

  // Modo: ¿Viene pre-seleccionado un lote?
  isFromSpecificRecord: boolean = false;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private insumoService: InsumoService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<StockFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockFormData
  ) {
    this.movimientoForm = this.createForm();
  }

  ngOnInit() {
    this.usuarioLogueado = this.authService.getUser();
    
    // Verificar si abrieron el modal desde un registro específico
    if (this.data?.stockData) {
      this.isFromSpecificRecord = true;
      this.selectedStock = this.data.stockData;
      
      // Pre-cargar datos
      this.cargarDatosIniciales(this.selectedStock!.ID_Insumo, this.selectedStock!.ID_Stock);
    } else {
      // Cargar lista completa para el buscador
      this.cargarTodosInsumos();
    }

    // Configurar filtro autocomplete
    this.filteredInsumos = this.movimientoForm.get('insumoNombre')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterInsumos(value || ''))
    );

    // Listener para cambios en Tipo de Movimiento (para validar cantidad máxima en salida)
    this.movimientoForm.get('Tipo_Mov')?.valueChanges.subscribe(() => {
      this.movimientoForm.get('Cantidad')?.updateValueAndValidity();
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      insumoNombre: [''], // Solo para búsqueda visual
      ID_Stock: [null, Validators.required], // ID Real del lote
      Tipo_Mov: ['Entrada', Validators.required],
      Cantidad: ['', [Validators.required, Validators.min(1)]],
      Motivo: [''] 
    });
  }

  // =========================================
  // 📥 CARGA DE DATOS
  // =========================================

  cargarTodosInsumos() {
    this.loadingInsumos = true;
    this.insumoService.getInsumos().subscribe({
      next: (data) => {
        this.insumos = data.filter(i => i.Estado === 'D'); // Solo disponibles
        this.loadingInsumos = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingInsumos = false;
      }
    });
  }

  cargarDatosIniciales(idInsumo: number, idStockPreseleccionado?: number) {
    this.loadingInsumos = true;
    // 1. Obtener info del insumo
    this.insumoService.getInsumoById(idInsumo).subscribe({
      next: (insumo) => {
        this.selectedInsumo = insumo;
        this.movimientoForm.patchValue({ insumoNombre: insumo.Nombre });
        
        // 2. Obtener lotes
        this.cargarLotesStock(idInsumo, idStockPreseleccionado);
      },
      error: () => this.loadingInsumos = false
    });
  }

  cargarLotesStock(idInsumo: number, idStockPreseleccionado?: number) {
    this.stockService.getStockByInsumoId(idInsumo).subscribe({
      next: (stocks) => {
        // Filtrar activos
        this.stocksDisponibles = stocks.filter(s => s.Estado === 'A');
        
        if (idStockPreseleccionado) {
          this.selectedStock = this.stocksDisponibles.find(s => s.ID_Stock === idStockPreseleccionado) || null;
          if (this.selectedStock) {
            this.movimientoForm.patchValue({ ID_Stock: this.selectedStock.ID_Stock });
          }
        } else if (this.stocksDisponibles.length === 1) {
          // Auto-seleccionar si solo hay uno
          this.selectedStock = this.stocksDisponibles[0];
          this.movimientoForm.patchValue({ ID_Stock: this.selectedStock.ID_Stock });
        }
        
        this.loadingInsumos = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingInsumos = false;
      }
    });
  }

  // =========================================
  // 🔍 AUTOCOMPLETE LOGIC
  // =========================================

  private _filterInsumos(value: string): Insumo[] {
    const filterValue = value.toLowerCase();
    return this.insumos.filter(option => 
      option.Nombre.toLowerCase().includes(filterValue) ||
      (option.Descripcion && option.Descripcion.toLowerCase().includes(filterValue))
    );
  }

  displayInsumoFn(nombre: string): string {
    return nombre || '';
  }

  onInsumoSelected(event: any) {
    const nombre = event.option.value;
    const insumo = this.insumos.find(i => i.Nombre === nombre);
    
    if (insumo) {
      this.selectedInsumo = insumo;
      this.selectedStock = null;
      this.movimientoForm.patchValue({ ID_Stock: null });
      this.cargarLotesStock(insumo.ID_Insumo);
    }
  }

  onStockSelected(idStock: number) {
    this.selectedStock = this.stocksDisponibles.find(s => s.ID_Stock === idStock) || null;
    this.movimientoForm.get('Cantidad')?.updateValueAndValidity();
  }

  // =========================================
  // 💾 SUBMIT
  // =========================================

  onSubmit() {
    // Validación personalizada de stock
    if (this.movimientoForm.value.Tipo_Mov === 'Salida' && this.selectedStock) {
      if (this.movimientoForm.value.Cantidad > this.selectedStock.Cantidad_Recibida) {
        Swal.fire('Error', `No hay suficiente stock en este lote. Disponible: ${this.selectedStock.Cantidad_Recibida}`, 'error');
        return;
      }
    }

    if (this.movimientoForm.invalid) {
      this.movimientoForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const dto: StockMovimientoDTO = {
      ID_Stock: this.movimientoForm.value.ID_Stock,
      Tipo_Mov: this.movimientoForm.value.Tipo_Mov,
      Cantidad: this.movimientoForm.value.Cantidad,
      Motivo: this.movimientoForm.value.Motivo
    };

    this.stockService.registrarMovimiento(dto).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Movimiento registrado correctamente', 'success');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', err.error?.error || 'No se pudo registrar el movimiento', 'error');
        this.loading = false;
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  // Helpers Visuales
  get stockLabelInfo(): string {
    if (!this.selectedStock) return '';
    return `Actual: ${this.selectedStock.Cantidad_Recibida} ${this.selectedInsumo?.Unidad_Med || ''}`;
  }
}