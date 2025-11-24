import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Modelos y Servicios Correctos
import { Insumo, InsumoCreacionDTO, InsumoUpdateDTO, CategoriaInsumo } from '../../../../core/models/insumo.model';
import { Proveedor } from '../../../../core/models/proveedor.model';
import { InsumoService } from '../../../../core/services/insumo.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
// 👇 1. IMPORTANTE: Se agrega la importación del módulo de Spinner
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import Swal from 'sweetalert2';

// Interfaz local para manejar el estado del formulario (combina Insumo + campos extra)
interface InsumoFormState {
  ID_Insumo: number;
  Nombre: string;
  Descripcion: string;
  Unidad_Med: string;
  ID_Categoria_I: number | null;
  Stock_Min: number;
  Stock_Max: number;
  
  // Campos opcionales para stock inicial/actualización
  ID_Proveedor?: number | null;
  Costo_Unitario?: number;
  Fecha_Vencimiento?: Date | null;
}

@Component({
  selector: 'app-insumo-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    // 👇 2. IMPORTANTE: Se agrega al array de imports del componente
    MatProgressSpinnerModule 
  ],
  templateUrl: './insumo-form.component.html',
  styleUrls: ['./insumo-form.component.css'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
})
export class InsumoFormComponent implements OnInit {
  
  formData: InsumoFormState;
  categorias: CategoriaInsumo[] = [];
  proveedores: Proveedor[] = [];
  minDate: Date;
  guardando: boolean = false;

  constructor(
    private insumoService: InsumoService,
    private categoriaService: CategoriaService,
    private proveedorService: ProveedorService,
    private dialogRef: MatDialogRef<InsumoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { insumo?: Insumo }
  ) {
    this.minDate = new Date();
    
    if (data?.insumo) {
      // MODO EDICIÓN
      this.formData = {
        ID_Insumo: data.insumo.ID_Insumo,
        Nombre: data.insumo.Nombre,
        Descripcion: data.insumo.Descripcion,
        Unidad_Med: data.insumo.Unidad_Med,
        ID_Categoria_I: data.insumo.ID_Categoria_I,
        Stock_Min: data.insumo.Stock_Min,
        Stock_Max: data.insumo.Stock_Max,
        ID_Proveedor: null,
        Costo_Unitario: 0,
        Fecha_Vencimiento: null 
      };
    } else {
      // MODO CREACIÓN
      this.formData = {
        ID_Insumo: 0,
        Nombre: '',
        Descripcion: '',
        Unidad_Med: '',
        ID_Categoria_I: null,
        Stock_Min: 5,
        Stock_Max: 100,
        ID_Proveedor: null,
        Costo_Unitario: 0,
        Fecha_Vencimiento: null
      };
    }
  }

  ngOnInit(): void {
    this.loadCategorias();
    this.loadProveedores();
  }

  loadCategorias() {
    this.categoriaService.getCategoriasInsumos().subscribe({
      next: (data) => this.categorias = data,
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  loadProveedores() {
    this.proveedorService.getProveedores().subscribe({
      next: (data) => this.proveedores = data.filter(p => p.Estado === 'A'),
      error: (err) => console.error('Error cargando proveedores', err)
    });
  }

  saveInsumo() {
    if (!this.formData.Nombre.trim()) {
      Swal.fire('Atención', 'El nombre del insumo es obligatorio', 'warning');
      return;
    }
    if (!this.formData.ID_Categoria_I) {
      Swal.fire('Atención', 'Debe seleccionar una categoría', 'warning');
      return;
    }
    if (!this.formData.Unidad_Med) {
      Swal.fire('Atención', 'Debe seleccionar una unidad de medida', 'warning');
      return;
    }
    if (this.formData.Costo_Unitario && this.formData.Costo_Unitario < 0) {
      Swal.fire('Error', 'El costo unitario no puede ser negativo', 'error');
      return;
    }
    if (this.formData.Stock_Min >= this.formData.Stock_Max) {
      Swal.fire('Error', 'El stock mínimo debe ser menor al stock máximo', 'error');
      return;
    }

    this.guardando = true;

    const baseData = {
      Nombre: this.formData.Nombre.trim(),
      Descripcion: this.formData.Descripcion?.trim() || '',
      Unidad_Med: this.formData.Unidad_Med,
      ID_Categoria_I: this.formData.ID_Categoria_I,
      Stock_Min: this.formData.Stock_Min,
      ID_Proveedor: this.formData.ID_Proveedor || null,
      Costo_Unitario: this.formData.Costo_Unitario || 0,
      Fecha_Vencimiento: this.formData.Fecha_Vencimiento 
        ? this.formData.Fecha_Vencimiento.toISOString().split('T')[0] 
        : null
    };

    if (this.formData.ID_Insumo === 0) {
      // CREAR
      const dto: InsumoCreacionDTO = { ...baseData };
      
      this.insumoService.createInsumo(dto).subscribe({
        next: () => this.handleSuccess('Insumo creado correctamente'),
        error: (err) => this.handleError('Error al crear insumo', err)
      });

    } else {
      // ACTUALIZAR
      const dto: InsumoUpdateDTO = { 
        ...baseData,
        Stock_Max: this.formData.Stock_Max
      };

      this.insumoService.updateInsumo(this.formData.ID_Insumo, dto).subscribe({
        next: () => this.handleSuccess('Insumo actualizado correctamente'),
        error: (err) => this.handleError('Error al actualizar insumo', err)
      });
    }
  }

  private handleSuccess(msg: string) {
    this.guardando = false;
    Swal.fire('¡Éxito!', msg, 'success');
    this.dialogRef.close(true);
  }

  private handleError(msg: string, err: any) {
    this.guardando = false;
    console.error(err);
    Swal.fire('Error', msg, 'error');
  }

  clearFecha() {
    this.formData.Fecha_Vencimiento = null;
  }

  close() {
    this.dialogRef.close(false);
  }
}