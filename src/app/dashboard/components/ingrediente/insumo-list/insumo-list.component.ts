import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

// Modelos y Servicios
import { Insumo } from '../../../../core/models/insumo.model';
import { CategoriaInsumo } from '../../../../core/models/insumo.model';
import { InsumoService } from '../../../../core/services/insumo.service';
import { CategoriaService } from '../../../../core/services/categoria.service';

// Componente Formulario
import { InsumoFormComponent } from '../insumo-form/insumo-form.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-insumo-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './insumo-list.component.html',
  styleUrls: ['./insumo-list.component.css']
})
export class InsumoListComponent implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<Insumo>([]);
  categorias: any[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private insumoService: InsumoService,
    private categoriaService: CategoriaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
    this.loadInsumos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // 📥 1. Cargar Categorías (Para mostrar nombres en la tabla)
  loadCategorias() {
    this.categoriaService.getCategoriasInsumos().subscribe({
      next: (data) => this.categorias = data,
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  // 📥 2. Cargar Insumos
  loadInsumos() {
    this.loading = true;
    this.insumoService.getInsumos().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
        
        if (this.paginator) {
          this.paginator.firstPage();
        }
      },
      error: (err) => {
        console.error('Error al cargar insumos', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los insumos', 'error');
      }
    });
  }

  // 🔍 Filtro
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // 🧹 Limpiar filtros
  limpiarFiltros() {
    const input = document.querySelector('.search-input-compact') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.dataSource.filter = '';
  }

  // 📝 Abrir Formulario (Crear/Editar)
  openInsumoForm(insumo?: Insumo) {
    const dialogRef = this.dialog.open(InsumoFormComponent, {
      width: '800px',
      disableClose: true,
      data: { insumo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loadInsumos();
      }
    });
  }

  // 🗑️ Eliminar
  deleteInsumo(insumo: Insumo) {
    Swal.fire({
      title: '¿Eliminar insumo?',
      text: `Se eliminará "${insumo.Nombre}" y todo su historial de stock.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.insumoService.deleteInsumo(insumo.ID_Insumo).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El insumo ha sido eliminado.', 'success');
            this.loadInsumos();
          },
          error: (err) => {
            console.error(err);
            if (err.status === 409) {
              Swal.fire('No se puede eliminar', 'El insumo está en uso en recetas o productos.', 'warning');
            } else {
              Swal.fire('Error', 'Ocurrió un error al eliminar.', 'error');
            }
          }
        });
      }
    });
  }

  // 🔧 Helpers Visuales
  getNombreCategoria(id: number): string {
    const cat = this.categorias.find(c => c.ID_Categoria_I === id);
    return cat ? cat.Nombre : '---';
  }

  getEstadoClass(estado: string): string {
    return estado === 'D' ? 'estado-disponible' : 'estado-agotado';
  }

  getEstadoLabel(estado: string): string {
    return estado === 'D' ? 'Disponible' : 'Agotado';
  }

  // Propiedad computada para filteredData
  get filteredData(): Insumo[] {
    return this.dataSource.filteredData;
  }
}