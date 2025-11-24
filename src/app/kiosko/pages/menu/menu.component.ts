import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';

// Services & Models
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { CombosService } from '../../../core/services/combos.service';
import { CarritoService } from '../../../core/services/carrito.service';

import { Producto } from '../../../core/models/producto.model';
import { CategoriaProducto } from '../../../core/models/categoria.model';
import { Combo } from '../../../core/models/combo.model';

// Components
import { DetalleProductoComponent } from '../../components/detalle-producto/detalle-producto.component';

// 🔹 Interfaz Unificada
interface MenuItem {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
  categoriaId: number;
  tipo: 'producto' | 'combo';
  precioDisplay: string;
  stock: number;
  dataOriginal: Producto | Combo;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, OnDestroy {
  
  allItems: MenuItem[] = [];
  filteredItems: MenuItem[] = [];
  paginatedItems: MenuItem[] = [];
  categorias: CategoriaProducto[] = [];

  loading = true;
  baseUrl = 'http://localhost:3000'; // Ajusta tu puerto

  terminoBusqueda: string = '';
  categoriaSeleccionada: number | null = null;

  pageSize = 8;
  currentPage = 0;
  pageSizeOptions = [8, 12, 16, 24];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  private destroy$ = new Subject<void>();

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private combosService: CombosService,
    public carritoService: CarritoService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos() {
    this.loading = true;

    forkJoin({
      categorias: this.categoriaService.getCategoriasProducto(),
      productos: this.productoService.getProductos(),
      combos: this.combosService.getCombos()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.categorias = res.categorias;
        const productosMapeados = this.procesarProductos(res.productos);
        const combosMapeados = this.procesarCombos(res.combos);

        this.allItems = [...combosMapeados, ...productosMapeados];
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando menú:', err);
        this.loading = false;
      }
    });
  }

  // 🔄 Mappers con Lógica de Imágenes
  private procesarProductos(productos: Producto[]): MenuItem[] {
    return productos
      .filter(p => p.Estado === 'A' && p.tamanos && p.tamanos.some(t => t.Estado === 'A'))
      .map(p => {
        const precios = p.tamanos!.filter(t => t.Estado === 'A').map(t => Number(t.Precio));
        const min = Math.min(...precios);
        const max = Math.max(...precios);
        const precioTxt = min === max ? `S/ ${min.toFixed(2)}` : `S/ ${min.toFixed(2)} +`;

        // 🖼️ Lógica: Extraer nombre del archivo y usar /imagenesCata/
        let imgUrl = 'assets/imgs/no-image.png';
        if (p.imagenes && p.imagenes.length > 0) {
           const filename = p.imagenes[0].split(/[/\\]/).pop(); // Obtiene "producto_1_1.jpg"
           imgUrl = `${this.baseUrl}/imagenesCata/${filename}`;
        }

        return {
          id: p.ID_Producto,
          nombre: p.Nombre,
          descripcion: p.Descripcion,
          imagen: imgUrl,
          categoriaId: p.ID_Categoria_P,
          tipo: 'producto',
          precioDisplay: precioTxt,
          stock: p.Cantidad_Disponible,
          dataOriginal: p
        };
      });
  }

  private procesarCombos(combos: Combo[]): MenuItem[] {
    return combos
      .filter(c => c.Estado === 'A')
      .map(c => {
        // 🖼️ Lógica: Extraer nombre del archivo y usar /imagenesCata/
        let imgUrl = 'assets/imgs/no-image.png';
        if (c.imagenes && c.imagenes.length > 0) {
           const filename = c.imagenes[0].split(/[/\\]/).pop(); // Obtiene "combo_1_1.jpg"
           imgUrl = `${this.baseUrl}/imagenesCata/${filename}`;
        }

        return {
          id: c.ID_Combo,
          nombre: c.Nombre,
          descripcion: c.Descripcion,
          imagen: imgUrl,
          categoriaId: 999,
          tipo: 'combo',
          precioDisplay: `S/ ${Number(c.Precio).toFixed(2)}`,
          stock: 100,
          dataOriginal: { ...c, ID_Combo: c.ID_Combo } 
        };
      });
  }

  filtrarPorCategoria(id: number | null) {
    this.categoriaSeleccionada = id;
    this.currentPage = 0;
    if (this.paginator) this.paginator.firstPage();
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let result = [...this.allItems];
    if (this.categoriaSeleccionada !== null) {
      result = result.filter(item => item.categoriaId === this.categoriaSeleccionada);
    }
    if (this.terminoBusqueda.trim()) {
      const term = this.terminoBusqueda.toLowerCase();
      result = result.filter(item => item.nombre.toLowerCase().includes(term));
    }
    this.filteredItems = result;
    this.actualizarPaginacion();
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.aplicarFiltros();
  }

  actualizarPaginacion() {
    const startIndex = this.currentPage * this.pageSize;
    this.paginatedItems = this.filteredItems.slice(startIndex, startIndex + this.pageSize);
    const grid = document.getElementById('menu-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth' });
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.actualizarPaginacion();
  }

  abrirDetalle(item: MenuItem) {
    const dialogData = item.tipo === 'combo' 
      ? { ...item.dataOriginal, esCombo: true, ID_Combo: item.id } 
      : { ...item.dataOriginal };

    this.dialog.open(DetalleProductoComponent, {
      width: '500px',
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '90vh',
      data: dialogData,
      panelClass: 'custom-dialog-container'
    });
  }

<<<<<<< HEAD
  onImageError(event: any) {
    event.target.src = 'assets/imgs/no-image.png';
=======
  // 🔹 MÉTODO PARA MOSTRAR RANGO DE PRECIOS
obtenerRangoPrecios(producto: ProductoConTamanos): string {
  if (producto.esCombo) {
    return `S/. ${producto.precioMinimo?.toFixed(2)}`;
  }
  
  // Para productos con múltiples tamaños, mostrar solo el precio mínimo
  if ((producto.tamanos?.length || 0) > 1) {
    return `S/. ${producto.precioMinimo?.toFixed(2)}`;
  }
  
  // Para productos con un solo tamaño, mostrar ese precio
  return `S/. ${producto.precioMinimo?.toFixed(2)}`;
}

// En menu.component.ts - modifica el método abrirPersonalizacion
abrirPersonalizacion(producto: ProductoConTamanos): void {
  const dialogData = {
    ...producto,
    esCombo: producto.esCombo // 🔹 IMPORTANTE: Indicar si es combo
  };

  this.dialog.open(DetalleProductoComponent, {
    width: '500px',
    maxWidth: '90vw',
    data: dialogData,
  });
}

  calcularTotalCarrito(): number {
    return this.carritoService
      .obtenerProductos()
      .reduce((total, item) => total + item.precio * item.cantidad!, 0);
  }

  confirmarPedido(): void {
    if (this.carritoService.obtenerProductos().length === 0) {
      alert('⚠️ El carrito está vacío.');
      return;
    }
    this.router.navigate(['/kiosko/pago']);
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
  }
}