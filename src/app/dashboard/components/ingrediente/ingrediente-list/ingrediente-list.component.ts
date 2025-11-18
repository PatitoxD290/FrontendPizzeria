// src/app/dashboard/components/ingrediente-list/ingrediente-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Insumo } from '../../../../core/models/ingrediente.model';
import { CategoriaInsumos } from '../../../../core/models/categoria.model';
import { IngredienteService } from '../../../../core/services/ingrediente.service';
import { CategoriaService } from '../../../../core/services/categoria.service';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

// 🔥 NUEVA IMPORTACIÓN: Componente del formulario
import { IngredienteFormComponent } from '../ingrediente-form/ingrediente-form.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-ingrediente-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
     
  ],
  templateUrl: './ingrediente-list.component.html',
  styleUrls: ['./ingrediente-list.component.css']
})
export class IngredienteListComponent implements OnInit {

  displayedColumns: string[] = [
    'ID_Insumo',
    'Nombre',
    'Descripcion',
    'Unidad_Med',
    'Categoria',
    'Stock_Min',
    'Stock_Max',
    'Estado',
    'Fecha_Registro',
    'Acciones'
  ];

  ingredientes: Insumo[] = [];
  dataSource = new MatTableDataSource<Insumo>([]);
  categorias: CategoriaInsumos[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ingredienteService: IngredienteService,
    private categoriaService: CategoriaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
    this.loadIngredientes();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  // 📥 Cargar categorías primero
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

  // 📦 Cargar ingredientes
  loadIngredientes() {
    this.loading = true;
    this.ingredienteService.getIngredientes().subscribe({
      next: data => {
        this.ingredientes = data;
        this.dataSource.data = data;
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar ingredientes', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los ingredientes', 'error');
      }
    });
  }

  // 🔍 Obtener nombre de categoría por ID
  getNombreCategoria(idCategoria: number): string {
    const categoria = this.categorias.find(cat => cat.ID_Categoria_I === idCategoria);
    return categoria ? categoria.Nombre : 'Sin categoría';
  }

  // 🔍 Aplicar filtro de búsqueda
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // 🗑️ Eliminar ingrediente
  deleteIngrediente(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ingredienteService.deleteIngrediente(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El ingrediente fue eliminado correctamente', 'success');
            this.loadIngredientes();
          },
          error: err => {
            console.error(err);
            Swal.fire('Error', 'No se pudo eliminar el ingrediente', 'error');
          }
        });
      }
    });
  }

  // 📝 Abrir formulario
  openIngredienteForm(ingrediente?: Insumo) {
    const dialogRef = this.dialog.open(IngredienteFormComponent, {
      width: '850px',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: { ingrediente }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadIngredientes();
    });
  }

  // 📊 Obtener texto del estado
  getEstadoText(estado: string): string {
    const estados: { [key: string]: string } = {
      'D': 'Disponible',
      'A': 'Agotado'
    };
    return estados[estado] || estado;
  }

  // 🎨 Obtener clase CSS para el estado
  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'D': 'estado-disponible',
      'A': 'estado-agotado'
    };
    return clases[estado] || '';
  }

  // 🔄 Refrescar lista
  refreshList() {
    this.loadIngredientes();
  }
}