import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Combo, ComboDetalle } from '../../../../core/models/combo.model';
import { CombosService } from '../../../../core/services/combos.service';
import { ComboFormComponent } from '../combo-form/combo-form.component';
import { MatDialog } from '@angular/material/dialog';

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
  ],
  templateUrl: './combo-list.component.html',
  styleUrl: './combo-list.component.css'
})
export class ComboListComponent implements OnInit {
  combos: ComboConDetalles[] = [];
  combosFiltrados: ComboConDetalles[] = [];
  cargando: boolean = false;
  error: string = '';
  
  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 6;
  totalItems: number = 0;
  totalPaginas: number = 0;
  paginas: number[] = [];

  // Filtros
  filtroEstado: string = 'todos';
  terminoBusqueda: string = '';

  constructor(
    private combosService: CombosService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.cargarCombos();
  }

  cargarCombos() {
    this.cargando = true;
    this.combosService.getCombos().subscribe({
      next: (combos: any[]) => {
        this.combos = combos;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar combos:', error);
        this.error = 'Error al cargar los combos';
        this.cargando = false;
      }
    });
  }

  // Método para obtener la ruta de la imagen del combo
  getComboImage(idCombo: number): string {
    const extensiones = ['png', 'jpg', 'jpeg', 'webp'];
    for (const ext of extensiones) {
      const url = `http://localhost:3000/imagenesCata/combo_${idCombo}_1.${ext}`;
      return url;
    }
    return 'assets/imgs/logo.png';
  }

  // Método para fallback si la imagen falla al cargar
  onImageError(event: any) {
    event.target.src = 'assets/imgs/logo.png';
  }

  // Aplicar filtros y paginación
  aplicarFiltros() {
    let combosFiltrados = [...this.combos];

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      combosFiltrados = combosFiltrados.filter(combo => combo.Estado === this.filtroEstado);
    }

    // Filtrar por búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      combosFiltrados = combosFiltrados.filter(combo => 
        combo.Nombre.toLowerCase().includes(termino) ||
        combo.Descripcion.toLowerCase().includes(termino)
      );
    }

    this.totalItems = combosFiltrados.length;
    this.totalPaginas = Math.ceil(this.totalItems / this.itemsPorPagina);
    
    // Generar array de páginas
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
    
    // Aplicar paginación
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.combosFiltrados = combosFiltrados.slice(inicio, fin);
  }

  // Cambiar página
  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.aplicarFiltros();
    }
  }

  // Cambiar items por página
  cambiarItemsPorPagina(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.itemsPorPagina = parseInt(target.value);
    this.paginaActual = 1;
    this.aplicarFiltros();
  }

  // Aplicar filtro de estado
  aplicarFiltroEstado(estado: string) {
    this.filtroEstado = estado;
    this.paginaActual = 1;
    this.aplicarFiltros();
  }

  // Buscar combos
  buscarCombos() {
    this.paginaActual = 1;
    this.aplicarFiltros();
  }

  // Limpiar búsqueda
  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.paginaActual = 1;
    this.aplicarFiltros();
  }

  // Crear nuevo combo
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
        this.cargarCombos(); // Recargar la lista
      }
    });
  }

  // Editar combo existente
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
        this.cargarCombos(); // Recargar la lista
      }
    });
  }

  // Eliminar combo
  eliminarCombo(combo: ComboConDetalles) {
    if (confirm(`¿Estás seguro de que deseas eliminar el combo "${combo.Nombre}"?`)) {
      this.combosService.deleteCombo(combo.ID_Combo).subscribe({
        next: () => {
          this.cargarCombos(); // Recargar todos los combos
        },
        error: (error) => {
          console.error('Error al eliminar combo:', error);
          alert('Error al eliminar el combo');
        }
      });
    }
  }

  // Obtener badge de estado
  getEstadoBadge(estado: string): { clase: string, texto: string } {
    return estado === 'A' 
      ? { clase: 'badge-activo', texto: 'Activo' }
      : { clase: 'badge-inactivo', texto: 'Inactivo' };
  }

  // Obtener texto de información de paginación
  getInfoPaginacion(): string {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.itemsPorPagina, this.totalItems);
    return `Mostrando ${inicio}-${fin} de ${this.totalItems} combos`;
  }
}