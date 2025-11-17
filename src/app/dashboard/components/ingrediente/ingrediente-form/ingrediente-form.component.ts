import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Insumo } from '../../../../core/models/ingrediente.model';
import { IngredienteService } from '../../../../core/services/ingrediente.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { ProveedorService } from '../../../../core/services/proveedor.service'; // Solo el servicio
import { Proveedor } from '../../../../core/models/proveedor.model'; // La interface desde models
import { CategoriaInsumos } from '../../../../core/models/categoria.model';
// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

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
  ],
  templateUrl: './ingrediente-form.component.html',
  styleUrls: ['./ingrediente-form.component.css'],
})
export class IngredienteFormComponent implements OnInit {
  ingrediente: Insumo;
  categorias: CategoriaInsumos[] = [];
  proveedores: Proveedor[] = [];
  minDate: Date;

  constructor(
    private ingredienteService: IngredienteService,
    private categoriaService: CategoriaService,
    private proveedorService: ProveedorService,
    private dialogRef: MatDialogRef<IngredienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ingrediente?: Insumo }
  ) {
    this.minDate = new Date();
    
    this.ingrediente = data?.ingrediente
      ? { 
          ...data.ingrediente,
          ID_Proveedor: null,
          Costo_Unitario: 0,
          Fecha_Vencimiento: null
        }
      : {
          ID_Insumo: 0,
          Nombre: '',
          Descripcion: '',
          Unidad_Med: '',
          ID_Categoria_I: 0,
          Stock_Min: 0,
          Stock_Max: 0,
          Estado: 'D', // Por defecto 'D' (Disponible)
          Fecha_Registro: '',
          ID_Proveedor: null,
          Costo_Unitario: 0,
          Fecha_Vencimiento: null
        };
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

  // 📥 Cargar proveedores (CORREGIDO: usar getProveedores en lugar de getProveedoresActivos)
  loadProveedores() {
    this.proveedorService.getProveedores().subscribe({
      next: (data) => {
        // Filtrar solo proveedores activos en el frontend si es necesario
        this.proveedores = data.filter(prov => prov.Estado === 'A');
      },
      error: (err) => {
        console.error('Error al cargar proveedores', err);
        Swal.fire('Error', 'No se pudieron cargar los proveedores', 'error');
      },
    });
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

    // Si es nuevo insumo (creación)
    if (this.ingrediente.ID_Insumo === 0) {
      this.ingredienteService.createIngrediente(this.ingrediente).subscribe({
        next: (response) => {
          Swal.fire('¡Éxito!', 'Ingrediente creado correctamente con stock inicial', 'success');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al crear ingrediente', err);
          Swal.fire('Error', 'No se pudo crear el ingrediente', 'error');
        },
      });
    } else {
      // Actualizar existente (sin datos de stock)
      const insumoData: Insumo = {
        ID_Insumo: this.ingrediente.ID_Insumo,
        Nombre: this.ingrediente.Nombre,
        Descripcion: this.ingrediente.Descripcion,
        Unidad_Med: this.ingrediente.Unidad_Med,
        ID_Categoria_I: this.ingrediente.ID_Categoria_I,
        Stock_Min: this.ingrediente.Stock_Min,
        Stock_Max: this.ingrediente.Stock_Max,
        Estado: this.ingrediente.Estado,
        Fecha_Registro: this.ingrediente.Fecha_Registro
      };

      this.ingredienteService.updateIngrediente(insumoData.ID_Insumo, insumoData).subscribe({
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