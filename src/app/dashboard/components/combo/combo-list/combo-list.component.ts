import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { Combo, ComboDetalle } from '../../../../core/models/combo.model';
import { CombosService } from '../../../../core/services/combos.service';
import { ComboFormComponent } from '../combo-form/combo-form.component';
import Swal from 'sweetalert2';

// Interface extendida para incluir detalles
interface ComboConDetalles extends Combo {
  detalles?: ComboDetalle[];
}

@Component({
  selector: 'app-combo-list',
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './combo-list.component.html',
  styleUrl: './combo-list.component.css'
})
export class ComboListComponent implements OnInit, OnDestroy {
  combos: ComboConDetalles[] = [];
  paginatedCombos: ComboConDetalles[] = [];
  cargando: boolean = false;
  error: string = '';
  
  // Configuración de paginación similar a producto-list
  pageSize = 8;
  pageSizeOptions = [4, 8, 12, 16];
  currentPage = 0;
  totalItems = 0;

  // Filtros
  filtroEstado: string = 'todos';
  terminoBusqueda: string = '';

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private combosService: CombosService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.cargarCombos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarCombos() {
    this.cargando = true;
    this.combosService.getCombos().subscribe({
      next: (combos: any[]) => {
        this.combos = combos;
        this.totalItems = this.combos.length;
        this.updatePaginatedData();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar combos:', error);
        this.error = 'Error al cargar los combos';
        this.cargando = false;
      }
    });
  }

  // 🔄 ACTIVAR COMBO
  activarCombo(combo: ComboConDetalles) {
    Swal.fire({
      title: '¿Activar combo?',
      html: `¿Estás seguro de activar <strong>"${combo.Nombre}"</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.combosService.activarCombo(combo.ID_Combo).subscribe({
          next: (response) => {
            this.showSuccess('Combo activado', 'El combo fue activado correctamente.');
            // Actualizar estado local
            combo.Estado = 'A';
          },
          error: (error) => {
            console.error('Error al activar combo:', error);
            this.showError('Error', 'No se pudo activar el combo.');
          }
        });
      }
    });
  }

  // 🔄 DESACTIVAR COMBO
  desactivarCombo(combo: ComboConDetalles) {
    Swal.fire({
      title: '¿Desactivar combo?',
      html: `¿Estás seguro de desactivar <strong>"${combo.Nombre}"</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.combosService.desactivarCombo(combo.ID_Combo).subscribe({
          next: (response) => {
            this.showSuccess('Combo desactivado', 'El combo fue desactivado correctamente.');
            // Actualizar estado local
            combo.Estado = 'I';
          },
          error: (error) => {
            console.error('Error al desactivar combo:', error);
            this.showError('Error', 'No se pudo desactivar el combo.');
          }
        });
      }
    });
  }

  // 🔄 TOGGLE ESTADO (Alternar entre activo/inactivo)
  toggleEstadoCombo(combo: ComboConDetalles) {
    if (combo.Estado === 'A') {
      this.desactivarCombo(combo);
    } else {
      this.activarCombo(combo);
    }
  }

  // Resto de métodos existentes...
  updatePaginatedData() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCombos = this.combos.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getComboImage(idCombo: number): string {
    const extensiones = ['png', 'jpg', 'jpeg', 'webp'];
    for (const ext of extensiones) {
      const url = `http://localhost:3000/imagenesCata/combo_${idCombo}_1.${ext}`;
      return url;
    }
    return 'assets/imgs/logo.png';
  }

  onImageError(event: any) {
    event.target.src = 'assets/imgs/logo.png';
  }

  aplicarFiltros() {
    let combosFiltrados = [...this.combos];

    if (this.filtroEstado !== 'todos') {
      combosFiltrados = combosFiltrados.filter(combo => combo.Estado === this.filtroEstado);
    }

    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      combosFiltrados = combosFiltrados.filter(combo => 
        combo.Nombre.toLowerCase().includes(termino) ||
        combo.Descripcion.toLowerCase().includes(termino)
      );
    }

    this.totalItems = combosFiltrados.length;
    this.currentPage = 0;
    this.combos = combosFiltrados;
    this.updatePaginatedData();
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.filtroEstado = 'todos';
    this.cargarCombos();
  }

  crearCombo() {
    const dialogRef = this.dialog.open(ComboFormComponent, {
      width: '1000px',
      maxWidth: '95vw',
      height: 'auto',
      autoFocus: false,
      data: { combo: null }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarCombos();
      }
    });
  }

  editarCombo(combo: ComboConDetalles) {
    const dialogRef = this.dialog.open(ComboFormComponent, {
      width: '1000px',
      maxWidth: '95vw',
      height: 'auto',
      autoFocus: false,
      data: { combo }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.cargarCombos();
      }
    });
  }

  eliminarCombo(combo: ComboConDetalles) {
    Swal.fire({
      title: '¿Eliminar combo?',
      html: `¿Estás seguro de eliminar <strong>"${combo.Nombre}"</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.combosService.deleteCombo(combo.ID_Combo).subscribe({
          next: () => {
            this.showSuccess('Combo eliminado', 'El combo fue eliminado correctamente.');
            this.cargarCombos();
            this.resetToFirstPage();
          },
          error: (error) => {
            console.error('Error al eliminar combo:', error);
            this.showError('Error', 'No se pudo eliminar el combo.');
          }
        });
      }
    });
  }

  resetToFirstPage() {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.updatePaginatedData();
  }

  getEstadoColor(estado: string): string {
    return estado === 'A' ? 'success' : 'warn';
  }

  getEstadoText(estado: string): string {
    return estado === 'A' ? 'Activo' : 'Inactivo';
  }

  getPrecioInfo(combo: ComboConDetalles): string {
    return `Precio del combo: S/ ${combo.Precio.toFixed(2)}`;
  }

  getProductosInfo(combo: ComboConDetalles): string {
    if (!combo.detalles || combo.detalles.length === 0) {
      return 'No hay productos en este combo';
    }
    
    return combo.detalles
      .map(detalle => `${detalle.Producto_Nombre}${detalle.Tamano_Nombre ? ` (${detalle.Tamano_Nombre})` : ''} x${detalle.Cantidad}`)
      .join('\n');
  }

  getCantidadProductos(combo: ComboConDetalles): number {
    return combo.detalles?.length || 0;
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return 'Sin descripción';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private showSuccess(title: string, text: string) {
    Swal.fire({ icon: 'success', title, text, timer: 2000, showConfirmButton: false });
  }

  private showError(title: string, text: string) {
    Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#d33' });
  }
}