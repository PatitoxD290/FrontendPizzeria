import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Core
import { Combo } from '../../../../core/models/combo.model';
import { CombosService } from '../../../../core/services/combos.service';
import { ComboFormComponent } from '../combo-form/combo-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-combo-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './combo-list.component.html',
  styleUrl: './combo-list.component.css'
})
export class ComboListComponent implements OnInit, OnDestroy {
  
  // Datos
  combos: Combo[] = [];
  paginatedCombos: Combo[] = [];
  
  // Estados UI
  cargando: boolean = false;
  error: string = '';
  
  // Paginación
  pageSize = 8;
  pageSizeOptions = [4, 8, 12, 16];
  currentPage = 0;
  totalItems = 0;

  // Filtros
  filtroEstado: string = 'todos';
  terminoBusqueda: string = '';

  private destroy$ = new Subject<void>();
  private baseUrl = 'http://localhost:3000'; // URL base para imágenes

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

  // 📥 Cargar datos
  cargarCombos() {
    this.cargando = true;
    this.combosService.getCombos().subscribe({
      next: (combos) => {
        this.combos = combos;
        this.aplicarFiltros(); // Aplica filtros y paginación inicial
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar combos:', error);
        this.error = 'Error al cargar los combos. Intente nuevamente.';
        this.cargando = false;
      }
    });
  }

  // 🖼️ Obtener imagen segura (Lógica corregida /imagenesCata/)
  getComboImage(combo: Combo): string {
    if (combo.imagenes && combo.imagenes.length > 0) {
      // 1. Extraemos solo el nombre del archivo (ej: combo_1_1.jpg)
      //    Esto limpia cualquier ruta relativa previa como 'uploads/' o '\'
      const filename = combo.imagenes[0].split(/[/\\]/).pop();
      
      // 2. Construimos la URL pública correcta
      return `${this.baseUrl}/imagenesCata/${filename}`;
    }
    return 'assets/imgs/no-image.png'; // Fallback
  }

  onImageError(event: any) {
    event.target.src = 'assets/imgs/no-image.png';
  }

  // 🔍 Filtros y Búsqueda
  aplicarFiltros() {
    let resultado = [...this.combos];

    // 1. Filtro Estado
    if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter(c => c.Estado === this.filtroEstado);
    }

    // 2. Búsqueda Texto
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      resultado = resultado.filter(c => 
        c.Nombre.toLowerCase().includes(termino) ||
        (c.Descripcion && c.Descripcion.toLowerCase().includes(termino))
      );
    }

    this.totalItems = resultado.length;
    
    // Resetear paginador si es necesario
    if (this.paginator && this.currentPage * this.pageSize >= this.totalItems) {
      this.currentPage = 0;
      this.paginator.firstPage();
    }

    // 3. Paginar resultados filtrados
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCombos = resultado.slice(startIndex, endIndex);
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.filtroEstado = 'todos';
    this.aplicarFiltros();
  }

  // 📄 Paginación
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.aplicarFiltros(); // Recalcular slice
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================
  // 🛠️ ACCIONES CRUD
  // =========================================

  crearCombo() {
    const dialogRef = this.dialog.open(ComboFormComponent, {
      width: '1000px',
      maxWidth: '95vw',
      disableClose: true,
      data: { combo: null }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.cargarCombos();
    });
  }

  editarCombo(combo: Combo) {
    const dialogRef = this.dialog.open(ComboFormComponent, {
      width: '1000px',
      maxWidth: '95vw',
      disableClose: true,
      data: { combo }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.cargarCombos();
    });
  }

  // 🗑️ Eliminar
  eliminarCombo(combo: Combo) {
    Swal.fire({
      title: '¿Eliminar combo?',
      html: `Se eliminará <strong>"${combo.Nombre}"</strong> permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.combosService.deleteCombo(combo.ID_Combo).subscribe({
          next: () => {
            this.showSuccess('Eliminado', 'El combo ha sido eliminado.');
            this.cargarCombos();
          },
          error: (err) => {
            console.error(err);
            this.showError('Error', 'No se pudo eliminar el combo.');
          }
        });
      }
    });
  }

  // 🔄 Activar/Desactivar
  toggleEstadoCombo(combo: Combo) {
    const esActivo = combo.Estado === 'A';
    const accion = esActivo ? 'desactivar' : 'activar';
    const nuevoEstado = esActivo ? 'I' : 'A';
    const colorBtn = esActivo ? '#ffc107' : '#28a745';

    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} combo?`,
      html: `El combo <strong>"${combo.Nombre}"</strong> pasará a estado <b>${nuevoEstado === 'A' ? 'Activo' : 'Inactivo'}</b>.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      confirmButtonColor: colorBtn
    }).then((result) => {
      if (result.isConfirmed) {
        this.combosService.toggleEstadoCombo(combo.ID_Combo, combo.Estado).subscribe({
          next: (res) => {
            // Actualizar localmente para feedback inmediato
            combo.Estado = res.Estado || nuevoEstado;
            
            // Si el backend dice que se quedó inactivo (por falta de stock), avisar
            if (nuevoEstado === 'A' && combo.Estado === 'I') {
              Swal.fire('Atención', 'El combo no se pudo activar porque faltan ingredientes en el stock.', 'warning');
            } else {
              this.showSuccess('Actualizado', `Combo ${accion}do correctamente.`);
            }
          },
          error: (err) => this.showError('Error', `No se pudo ${accion} el combo.`)
        });
      }
    });
  }

  // =========================================
  // 🎨 HELPERS VISUALES
  // =========================================

  getEstadoColor(estado: string): string {
    return estado === 'A' ? 'primary' : 'warn'; // Material colors
  }

  getEstadoText(estado: string): string {
    return estado === 'A' ? 'Activo' : 'Inactivo';
  }

  getProductosInfo(combo: Combo): string {
    if (!combo.detalles || combo.detalles.length === 0) return 'Sin productos';
    
    return combo.detalles
      .map(d => `• ${d.Producto_Nombre} (${d.Tamano_Nombre}) x${d.Cantidad}`)
      .join('\n');
  }

  private showSuccess(title: string, text: string) {
    Swal.fire({ icon: 'success', title, text, timer: 2000, showConfirmButton: false });
  }

  private showError(title: string, text: string) {
    Swal.fire({ icon: 'error', title, text });
  }
}