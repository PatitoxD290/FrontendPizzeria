import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip'; // Importante para matTooltip
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs'; // Para cargar datos en paralelo

import { CategoriaService } from '../../../../core/services/categoria.service';
import { CategoriaProducto, CategoriaInsumos } from '../../../../core/models/categoria.model';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';

@Component({
  selector: 'app-categoria-list',
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
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './categoria-list.component.html',
  styleUrls: ['./categoria-list.component.css']
})
export class CategoriaListComponent implements OnInit {

  categoriasProductos: CategoriaProducto[] = [];
  categoriasInsumos: CategoriaInsumos[] = [];
  
  // Datos paginados para la vista
  paginatedProductos: CategoriaProducto[] = [];
  paginatedInsumos: CategoriaInsumos[] = [];
  
  loading = false;
  selectedTab = 0; // 0 = Productos, 1 = Insumos

  // Configuración de paginación
  pageSize = 5;
  pageSizeOptions = [5, 10, 25, 50];
  
  currentPageProductos = 0;
  totalProductos = 0;

  currentPageInsumos = 0;
  totalInsumos = 0;

  @ViewChild('paginatorProductos') paginatorProductos!: MatPaginator;
  @ViewChild('paginatorInsumos') paginatorInsumos!: MatPaginator;

  // Definición de columnas
  columnas: string[] = ['id', 'nombre', 'acciones'];

  constructor(
    private categoriaService: CategoriaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  // 🔄 Carga simultánea de datos
  loadAllData() {
    this.loading = true;
    
    forkJoin({
      productos: this.categoriaService.getCategoriasProducto(),
      insumos: this.categoriaService.getCategoriasInsumos()
    }).subscribe({
      next: (result) => {
        // Productos
        this.categoriasProductos = result.productos;
        this.totalProductos = result.productos.length;
        this.updatePaginatedProductos();

        // Insumos
        this.categoriasInsumos = result.insumos;
        this.totalInsumos = result.insumos.length;
        this.updatePaginatedInsumos();

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
      }
    });
  }

  // Recargar solo la lista activa (útil después de crear/editar)
  reloadCurrentTab() {
    this.loadAllData(); // Por simplicidad recargamos todo, pero podrías optimizar
  }

  // =========================================
  // 📄 Lógica de Paginación
  // =========================================

  updatePaginatedProductos() {
    const startIndex = this.currentPageProductos * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProductos = this.categoriasProductos.slice(startIndex, endIndex);
  }

  updatePaginatedInsumos() {
    const startIndex = this.currentPageInsumos * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedInsumos = this.categoriasInsumos.slice(startIndex, endIndex);
  }

  onPageChangeProductos(event: PageEvent) {
    this.currentPageProductos = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedProductos();
  }

  onPageChangeInsumos(event: PageEvent) {
    this.currentPageInsumos = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedInsumos();
  }

  onTabChange(index: number) {
    this.selectedTab = index;
  }

  // =========================================
  // 🗑️ Eliminar Categoría
  // =========================================

  deleteCategoria(categoria: CategoriaProducto | CategoriaInsumos, tipo: 'producto' | 'insumo') {
    const id = this.getId(categoria, tipo);
    const nombre = categoria.Nombre;

    Swal.fire({
      title: `¿Eliminar "${nombre}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        
        // Seleccionar el observable correcto
        const deleteObs = tipo === 'producto'
          ? this.categoriaService.deleteCategoriaProducto(id)
          : this.categoriaService.deleteCategoriaInsumo(id);

        deleteObs.subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La categoría ha sido eliminada.', 'success');
            this.loadAllData();
          },
          error: (err) => {
            console.error(err);
            // Manejo específico de error de FK (Backend devuelve 400 o 409)
            if (err.status === 400 || err.status === 409) {
              Swal.fire({
                icon: 'error',
                title: 'No se puede eliminar',
                text: `La categoría "${nombre}" está siendo usada por productos o insumos activos.`
              });
            } else {
              Swal.fire('Error', 'Ocurrió un problema al eliminar.', 'error');
            }
          }
        });
      }
    });
  }

  // =========================================
  // 📝 Abrir Formulario (Modal)
  // =========================================

  openCategoriaForm(categoria?: CategoriaProducto | CategoriaInsumos, tipoOverride?: 'producto' | 'insumo') {
    // Determinar el tipo: si viene forzado, o según el tab actual
    const tipo = tipoOverride || (this.selectedTab === 0 ? 'producto' : 'insumo');

    const dialogRef = this.dialog.open(CategoriaFormComponent, {
      width: '500px',
      disableClose: true, // Evita cerrar clickeando afuera por accidente
      data: { 
        categoria: categoria ? { ...categoria } : null, // Clonar para no mutar la tabla
        tipo 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Si retornó true, hubo cambios -> recargar
        this.loadAllData();
      }
    });
  }

  // =========================================
  // 🔧 Helpers de UI
  // =========================================

  // Obtener ID de forma segura según el tipo
  getId(item: CategoriaProducto | CategoriaInsumos, tipo: 'producto' | 'insumo'): number {
    if (tipo === 'producto') {
      return (item as CategoriaProducto).ID_Categoria_P;
    }
    return (item as CategoriaInsumos).ID_Categoria_I;
  }
}