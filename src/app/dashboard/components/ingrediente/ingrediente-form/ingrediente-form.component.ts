import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Insumo } from '../../../../core/models/ingrediente.model';
import { IngredienteService } from '../../../../core/services/ingrediente.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { Proveedor } from '../../../../core/models/proveedor.model';
import { CategoriaInsumos } from '../../../../core/models/categoria.model';
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

import Swal from 'sweetalert2';

@Component({
  selector: 'app-ingrediente-form',
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
    MatIconModule
  ],
  templateUrl: './ingrediente-form.component.html',
  styleUrls: ['./ingrediente-form.component.css'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
})
export class IngredienteFormComponent implements OnInit {
  ingrediente: Insumo;
  categorias: CategoriaInsumos[] = [];
  proveedores: Proveedor[] = [];
  minDate: Date;
  fechaVencimiento: Date | null = null;

  constructor(
    private ingredienteService: IngredienteService,
    private categoriaService: CategoriaService,
    private proveedorService: ProveedorService,
    private dialogRef: MatDialogRef<IngredienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ingrediente?: Insumo }
  ) {
    this.minDate = new Date();
    
    // Inicializar el ingrediente con valores por defecto explícitos
    this.ingrediente = data?.ingrediente
      ? { 
          ...data.ingrediente,
          ID_Proveedor: data.ingrediente.ID_Proveedor !== undefined ? data.ingrediente.ID_Proveedor : null,
          Costo_Unitario: data.ingrediente.Costo_Unitario !== undefined ? data.ingrediente.Costo_Unitario : 0,
          Fecha_Vencimiento: data.ingrediente.Fecha_Vencimiento || null,
          Stock_Max: data.ingrediente.Stock_Max || 1000
        }
      : {
          ID_Insumo: 0,
          Nombre: '',
          Descripcion: '',
          Unidad_Med: '',
          ID_Categoria_I: 0,
          Stock_Min: 0,
          Stock_Max: 1000,
          Estado: 'D',
          Fecha_Registro: '',
          ID_Proveedor: null,
          Costo_Unitario: 0,
          Fecha_Vencimiento: null
        };

    console.log('Ingrediente cargado para edición:', this.ingrediente); // Para debug

    // Inicializar la fecha para el datepicker
    if (this.ingrediente.Fecha_Vencimiento) {
      this.fechaVencimiento = new Date(this.ingrediente.Fecha_Vencimiento);
    }
  }

  ngOnInit(): void {
    this.loadCategorias();
    this.loadProveedores();
  }

  // 📥 Cargar categorías de insumos
  loadCategorias() {
    this.categoriaService.getCategoriasInsumos().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (err) => {
        console.error('Error al cargar categorías', err);
        Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
      },
    });
  }

  // 📥 Cargar proveedores
  loadProveedores() {
    this.proveedorService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = data.filter(prov => prov.Estado === 'A');
        console.log('Proveedores cargados:', this.proveedores); // Para debug
      },
      error: (err) => {
        console.error('Error al cargar proveedores', err);
        Swal.fire('Error', 'No se pudieron cargar los proveedores', 'error');
      },
    });
  }

  // 🔥 Manejar cambio de fecha
  onDateChange() {
    if (this.fechaVencimiento) {
      this.ingrediente.Fecha_Vencimiento = this.fechaVencimiento.toISOString().split('T')[0];
    } else {
      this.ingrediente.Fecha_Vencimiento = null;
    }
  }

  // 🔥 Limpiar fecha
  clearFechaVencimiento() {
    this.fechaVencimiento = null;
    this.ingrediente.Fecha_Vencimiento = null;
  }

  saveIngrediente() {
    if (!this.ingrediente.Nombre.trim()) {
      Swal.fire('Error', 'El nombre del ingrediente es obligatorio', 'warning');
      return;
    }

    if (!this.ingrediente.ID_Categoria_I) {
      Swal.fire('Error', 'Debe seleccionar una categoría', 'warning');
      return;
    }

    if (!this.ingrediente.Unidad_Med) {
      Swal.fire('Error', 'Debe seleccionar una unidad de medida', 'warning');
      return;
    }

    // Validar que el costo unitario no sea negativo
    if (this.ingrediente.Costo_Unitario && this.ingrediente.Costo_Unitario < 0) {
      Swal.fire('Error', 'El costo unitario no puede ser negativo', 'warning');
      return;
    }

    // Validar que Stock_Min no sea mayor que Stock_Max
    if (this.ingrediente.Stock_Min > this.ingrediente.Stock_Max!) {
      Swal.fire('Error', 'El stock mínimo no puede ser mayor al stock máximo', 'warning');
      return;
    }

    console.log('Datos a guardar:', this.ingrediente); // Para debug

    // Si es nuevo insumo (creación)
    if (this.ingrediente.ID_Insumo === 0) {
      this.ingredienteService.createIngrediente(this.ingrediente).subscribe({
        next: (response) => {
          Swal.fire('¡Éxito!', 'Ingrediente creado correctamente', 'success');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al crear ingrediente', err);
          Swal.fire('Error', 'No se pudo crear el ingrediente', 'error');
        },
      });
    } else {
      // Actualizar existente - ENVIAR TODOS LOS CAMPOS
      this.ingredienteService.updateIngrediente(this.ingrediente.ID_Insumo, this.ingrediente).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Ingrediente actualizado correctamente', 'success');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al actualizar ingrediente', err);
          Swal.fire('Error', 'No se pudo actualizar el ingrediente', 'error');
        },
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}