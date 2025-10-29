import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Insumo } from '../../../../core/models/ingrediente.model';
import { IngredienteService } from '../../../../core/services/ingrediente.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { CategoriaInsumos } from '../../../../core/models/categoria.model';
// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

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
  ],
  templateUrl: './ingrediente-form.component.html',
  styleUrls: ['./ingrediente-form.component.css'],
})
export class IngredienteFormComponent implements OnInit {
  ingrediente: Insumo;
  categorias: CategoriaInsumos[] = []; // ← Aquí guardaremos las categorías

  constructor(
    private ingredienteService: IngredienteService,
    private categoriaService: CategoriaService, // ← Inyectamos el servicio
    private dialogRef: MatDialogRef<IngredienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ingrediente?: Insumo }
  ) {
    this.ingrediente = data?.ingrediente
      ? { ...data.ingrediente }
      : {
          ID_Insumo: 0,
          Nombre: '',
          Descripcion: '',
          Unidad_Med: '',
          ID_Categoria_I: 0,
          Stock_Min: 0,
          Stock_Max: 0,
          Estado: 'A',
          Fecha_Registro: '',
        };
  }

  ngOnInit(): void {
    this.loadCategorias();
  }

  // 📥 Cargar categorías de insumos
  loadCategorias() {
    this.categoriaService.getCategoriasInsumos().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (err) => {
        console.error('Error al cargar categorías', err);
      },
    });
  }

  saveIngrediente() {
    if (!this.ingrediente.Nombre.trim()) {
      Swal.fire('Error', 'El nombre del ingrediente es obligatorio', 'warning');
      return;
    }
    if (this.ingrediente.ID_Insumo === 0) {
      // Crear nuevo
      this.ingredienteService.createIngrediente(this.ingrediente).subscribe({
        next: () => {
          Swal.fire('¡Éxito!', 'Ingrediente creado correctamente', 'success');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al crear ingrediente', err);
          Swal.fire('Error', 'No se pudo crear el ingrediente', 'error');
        },
      });
    } else {
      // Actualizar existente
      this.ingredienteService
        .updateIngrediente(this.ingrediente.ID_Insumo, this.ingrediente)
        .subscribe({
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
