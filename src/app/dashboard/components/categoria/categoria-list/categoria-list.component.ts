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
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { Output, EventEmitter } from '@angular/core';

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
  
  // Datos paginados
  paginatedProductos: CategoriaProducto[] = [];
  paginatedInsumos: CategoriaInsumos[] = [];
  
  loading = false;
  selectedTab = 0; // 0 para productos, 1 para insumos

  // Configuración de paginación
  pageSize = 5;
  pageSizeOptions = [5, 10, 25, 50];
  currentPageProductos = 0;
  currentPageInsumos = 0;
  totalProductos = 0;
  totalInsumos = 0;

  categoriaActiva: number | null = 0;

  @ViewChild('paginatorProductos') paginatorProductos!: MatPaginator;
  @ViewChild('paginatorInsumos') paginatorInsumos!: MatPaginator;

  // Columnas para las tablas (sin descripción)
  columnasProductos: string[] = ['id', 'nombre', 'acciones'];
  columnasInsumos: string[] = ['id', 'nombre', 'acciones'];

  @Output() categoriaSeleccionada = new EventEmitter<number>();

  constructor(
    private categoriaService: CategoriaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
  }

  // 🔁 Cargar todas las categorías usando forkJoin
  loadCategorias() {
    this.loading = true;
    
    forkJoin({
      productos: this.categoriaService.getCategoriasProducto(),
      insumos: this.categoriaService.getCategoriasInsumos()
    }).subscribe({
      next: (result) => {
        // Categorías de productos
        this.categoriasProductos = result.productos;
        this.totalProductos = result.productos.length;
        this.updatePaginatedProductos();

        // Categorías de insumos
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

  // Actualizar datos paginados para productos
  updatePaginatedProductos() {
    const startIndex = this.currentPageProductos * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProductos = this.categoriasProductos.slice(startIndex, endIndex);
  }

  // Actualizar datos paginados para insumos
  updatePaginatedInsumos() {
    const startIndex = this.currentPageInsumos * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedInsumos = this.categoriasInsumos.slice(startIndex, endIndex);
  }

  // Manejar cambio de página en productos
  onPageChangeProductos(event: PageEvent) {
    this.currentPageProductos = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedProductos();
  }

  // Manejar cambio de página en insumos
  onPageChangeInsumos(event: PageEvent) {
    this.currentPageInsumos = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedInsumos();
  }

  // 🗑️ Eliminar categoría (Versión mejorada con manejo de errores)
  deleteCategoria(categoria: CategoriaProducto | CategoriaInsumos, tipo: 'producto' | 'insumo') {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = this.getIdCategoria(categoria, tipo);
        const nombreCategoria = this.getNombreCategoria(categoria);

        const deleteObs = tipo === 'producto'
          ? this.categoriaService.deleteCategoriaProducto(id)
          : this.categoriaService.deleteCategoriaInsumo(id);

        deleteObs.subscribe({
          next: () => {
            Swal.fire({
              title: '¡Eliminada!',
              text: `La categoría "${nombreCategoria}" ha sido eliminada.`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadCategorias();
          },
          error: (error) => {
            console.error('Error al eliminar categoría:', error);
            
            // Verificar si es error de integridad referencial
            if (error.status === 400 || error.status === 409) {
              const errorMessage = error.error?.error || 'Hay elementos asociados a esta categoría';
              
              // Mostrar mensaje específico para productos/insumos asociados
              if (errorMessage.includes('productos asociados') || errorMessage.includes('insumos asociados') || error.status === 409) {
                Swal.fire({
                  title: 'No se puede eliminar',
                  html: `
                    <div style="text-align: left;">
                      <p><strong>La categoría "${nombreCategoria}" no puede ser eliminada porque tiene ${tipo === 'producto' ? 'productos' : 'insumos'} asociados.</strong></p>
                      <p style="margin-top: 10px; font-size: 14px; color: #666;">
                        ${tipo === 'producto' 
                          ? 'Debes eliminar o reassignar los productos asociados antes de eliminar esta categoría.' 
                          : 'Debes eliminar o reassignar los insumos asociados antes de eliminar esta categoría.'
                        }
                      </p>
                    </div>
                  `,
                  icon: 'warning',
                  confirmButtonText: 'Entendido',
                  confirmButtonColor: '#3085d6',
                  width: 500
                });
              } else {
                // Otro error 400/409
                Swal.fire('Error', errorMessage, 'error');
              }
            } else {
              // Error genérico
              Swal.fire('Error', 'No se pudo eliminar la categoría', 'error');
            }
          }
        });
      }
    });
  }

  // 📝 Abrir modal para crear/editar
  openCategoriaForm(categoria?: CategoriaProducto | CategoriaInsumos, tipoOverride?: 'producto' | 'insumo') {
    const tipo = tipoOverride || (this.selectedTab === 0 ? 'producto' : 'insumo');
    
    const dialogRef = this.dialog.open(CategoriaFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
      data: { 
        categoria: categoria ? { ...categoria } : null,
        tipo
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategorias();
      }
    });
  }

  // Método para emitir la categoría seleccionada
  seleccionarCategoria(categoria: CategoriaProducto | CategoriaInsumos) {
    const id = this.getIdCategoria(categoria, this.selectedTab === 0 ? 'producto' : 'insumo');
    this.categoriaActiva = id;
    this.categoriaSeleccionada.emit(id);
  }

  // Cambiar entre tabs
  onTabChange(index: number) {
    this.selectedTab = index;
  }

  // Obtener ID de categoría según tipo
  getIdCategoria(categoria: CategoriaProducto | CategoriaInsumos, tipo: 'producto' | 'insumo'): number {
    if (tipo === 'producto') {
      return (categoria as CategoriaProducto).ID_Categoria_P;
    }
    return (categoria as CategoriaInsumos).ID_Categoria_I;
  }

  // Obtener nombre de categoría
  getNombreCategoria(categoria: CategoriaProducto | CategoriaInsumos): string {
    return categoria.Nombre || '';
  }
}