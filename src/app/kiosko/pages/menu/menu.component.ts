import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

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

import { Producto, ProductoTamano } from '../../../core/models/producto.model';
import { CategoriaProducto } from '../../../core/models/categoria.model';
import { Combo } from '../../../core/models/combo.model';

// Components
import { DetalleProductoComponent } from '../../components/detalle-producto/detalle-producto.component';

// 🔹 INTERFACE SIMPLIFICADA - SOLO PRODUCTOS
interface ProductoConTamanos {
  ID_Producto: number;
  Nombre: string;
  Descripcion: string;
  ID_Categoria_P: number;
  nombre_categoria?: string;
  imagen: string;
  tamanos?: ProductoTamano[];
  detallesTexto?: string;
  esCombo: boolean;
  precioMinimo?: number;
  precioMaximo?: number;
  Precio?: number; // Para combos
  ID_Combo?: number; // Para combos
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
    MatPaginatorModule,
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, OnDestroy {
  
  // 🔹 Variables de búsqueda y filtrado
  searchTerm: string = '';
  filtroCategoria: string = '';
  
  // 🔹 Datos principales
  productos: ProductoConTamanos[] = [];
  productosOriginales: ProductoConTamanos[] = [];
  categorias: CategoriaProducto[] = [];
  CATEGORY_MAP: Record<number, string> = {};

  // 🔹 Estado y paginación
  loading = true;
  baseUrl = 'http://localhost:3000';
  
  pageSize = 8;
  currentPage = 0;
  pageSizeOptions = [8, 12, 16, 24];
  paginatedItems: ProductoConTamanos[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  private destroy$ = new Subject<void>();

  // 🔹 Listeners para eventos
  private categoriaListener: any;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private combosService: CombosService,
    public carritoService: CarritoService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCategoriasDesdeService();
    
    // Escuchar eventos de cambio de categoría desde el header
    this.categoriaListener = (event: any) => {
      this.filtroCategoria = event.detail;
      this.aplicarFiltros();
    };
    window.addEventListener('cambioCategoria', this.categoriaListener);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.categoriaListener) {
      window.removeEventListener('cambioCategoria', this.categoriaListener);
    }
  }

  // 🔹 CARGA DE CATEGORÍAS
  private cargarCategoriasDesdeService(): void {
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (data: CategoriaProducto[]) => {
        if (Array.isArray(data)) {
          this.categorias = data;
          this.CATEGORY_MAP = data.reduce((acc, item) => {
            acc[item.ID_Categoria_P] = item.Nombre ?? `Categoría ${item.ID_Categoria_P}`;
            return acc;
          }, {} as Record<number, string>);

          const existeCombos = data.some(
            (item) => item.Nombre && item.Nombre.toLowerCase() === 'combos'
          );
          if (!existeCombos) {
            this.CATEGORY_MAP[999] = 'Combos';
          }
        }
        this.cargarProductosYCombos();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.CATEGORY_MAP = {};
        this.CATEGORY_MAP[999] = 'Combos';
        this.cargarProductosYCombos();
      },
    });
  }

  // 🔹 CARGA DE PRODUCTOS Y COMBOS
  private cargarProductosYCombos(): void {
    this.loading = true;

    forkJoin({
      productos: this.productoService.getProductos(),
      combos: this.combosService.getCombos()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: async (res) => {
        // Procesar productos
        const productosProcesados = await this.procesarProductos(res.productos);
        
        // Procesar combos
        const combosProcesados = await this.procesarCombos(res.combos);

        this.productos = [...combosProcesados, ...productosProcesados];
        this.productosOriginales = [...this.productos];
        this.actualizarPaginacion();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando menú:', err);
        this.loading = false;
      }
    });
  }

  // 🔹 PROCESAR PRODUCTOS INDIVIDUALES
  private async procesarProductos(productosData: any): Promise<ProductoConTamanos[]> {
    const rawArray = Array.isArray(productosData) ? productosData : productosData ? [productosData] : [];
    
    const productosActivos = rawArray.filter(
      (item: any) => item.Estado === 'A' && item.tamanos && item.tamanos.some((t: ProductoTamano) => t.Estado === 'A')
    );

    const productosConTamanos: ProductoConTamanos[] = [];

    for (const producto of productosActivos) {
      const tamanosActivos = producto.tamanos.filter((t: ProductoTamano) => t.Estado === 'A');
      
      // 🔹 CALCULAR PRECIO MÍNIMO Y MÁXIMO
      const precios = tamanosActivos.map((t: ProductoTamano) => t.Precio);
      const precioMinimo = Math.min(...precios);
      const precioMaximo = Math.max(...precios);

      const imagen = await this.verificarImagenProducto(
        `http://localhost:3000/imagenesCata/producto_${producto.ID_Producto ?? 0}_1`
      );
      const nombreCategoria = this.CATEGORY_MAP[producto.ID_Categoria_P] || 'Sin categoría';

      const productoConTamanos: ProductoConTamanos = {
        ID_Producto: producto.ID_Producto,
        Nombre: producto.Nombre ?? 'Sin nombre',
        Descripcion: producto.Descripcion ?? '',
        ID_Categoria_P: producto.ID_Categoria_P,
        nombre_categoria: nombreCategoria,
        imagen: imagen,
        tamanos: tamanosActivos,
        esCombo: false,
        precioMinimo: precioMinimo,
        precioMaximo: precioMaximo
      };
      productosConTamanos.push(productoConTamanos);
    }

    return productosConTamanos;
  }

  // 🔹 PROCESAR COMBOS
  private async procesarCombos(combosData: any[]): Promise<ProductoConTamanos[]> {
    const combosActivos = combosData.filter(
      (item) => item.Estado === 'A' || item.estado === 'A'
    );

    const combosPromesas = combosActivos.map(async (item: any) => {
      const detallesTexto = Array.isArray(item.detalles)
        ? item.detalles
            .map(
              (d: any) =>
                `${d.Producto_Nombre ?? ''} (${d.Tamano_Nombre ?? ''}) x${d.Cantidad ?? 1}`
            )
            .join(', ')
        : '';

      return {
        ID_Producto: item.ID_Combo ?? 0,
        ID_Combo: item.ID_Combo ?? 0,
        Nombre: item.Nombre ?? 'Combo sin nombre',
        Descripcion: item.Descripcion ?? '',
        ID_Categoria_P: 999,
        nombre_categoria: 'Combos',
        imagen: await this.verificarImagenProducto(
          `http://localhost:3000/imagenesCata/combo_${item.ID_Combo ?? 0}_1`
        ),
        tamanos: [],
        esCombo: true,
        detallesTexto,
        precioMinimo: Number(item.Precio ?? 0),
        precioMaximo: Number(item.Precio ?? 0),
        Precio: Number(item.Precio ?? 0)
      };
    });

    return await Promise.all(combosPromesas);
  }

  // 🔹 VERIFICACIÓN DE IMÁGENES
  private async verificarImagenProducto(urlBase: string): Promise<string> {
    const extensiones = ['png', 'jpg', 'jpeg'];
    for (const ext of extensiones) {
      const url = `${urlBase}.${ext}`;
      try {
        const resp = await fetch(url, { method: 'HEAD' });
        if (resp.ok) return url;
      } catch {
        // ignoramos errores
      }
    }
    return '/assets/imgs/logo.png';
  }

  // 🔹 MÉTODOS DE INTERFAZ DE USUARIO
  abrirPersonalizacion(producto: ProductoConTamanos): void {
    const dialogData = {
      ...producto,
      esCombo: producto.esCombo
    };

    this.dialog.open(DetalleProductoComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: dialogData,
    });
  }

  obtenerRangoPrecios(producto: ProductoConTamanos): string {
    if (producto.esCombo) {
      return `S/. ${producto.precioMinimo?.toFixed(2)}`;
    }
    
    if ((producto.tamanos?.length || 0) > 1) {
      return `S/. ${producto.precioMinimo?.toFixed(2)}`;
    }
    
    return `S/. ${producto.precioMinimo?.toFixed(2)}`;
  }

  // 🔹 FILTRADO Y BÚSQUEDA
  get productosFiltrados(): ProductoConTamanos[] {
    return this.productos.filter((p) => {
      const coincideCategoria = this.filtroCategoria
        ? p.nombre_categoria === this.filtroCategoria
        : true;
      const coincideBusqueda = this.searchTerm
        ? p.Nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          p.Descripcion.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
      return coincideCategoria && coincideBusqueda;
    });
  }

  aplicarFiltros() {
    this.currentPage = 0;
    this.actualizarPaginacion();
  }

  filtrarPorCategoria(id: number | null) {
    if (id === null) {
      this.filtroCategoria = '';
    } else if (id === 999) {
      this.filtroCategoria = 'Combos';
    } else {
      const categoria = this.categorias.find(c => c.ID_Categoria_P === id);
      this.filtroCategoria = categoria ? categoria.Nombre : '';
    }
    this.currentPage = 0;
    if (this.paginator) this.paginator.firstPage();
    this.aplicarFiltros();
  }

  limpiarBusqueda() {
    this.searchTerm = '';
    this.filtroCategoria = '';
    this.aplicarFiltros();
  }

  // 🔹 PAGINACIÓN
  actualizarPaginacion() {
    const resultado = this.productosFiltrados;
    const startIndex = this.currentPage * this.pageSize;
    this.paginatedItems = resultado.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.actualizarPaginacion();
  }

  onImageError(event: any) {
    event.target.src = '/assets/imgs/logo-aita/logo.png';
  }

  // 🔹 MÉTODOS DEL CARRITO - CORREGIDOS
  calcularTotalCarrito(): number {
    return this.carritoService
      .obtenerProductos()
      .reduce((total, item) => total + item.precioUnitario * item.cantidad!, 0); // ✅ Cambiado de 'precio' a 'precioUnitario'
  }

  confirmarPedido(): void {
    if (this.carritoService.obtenerProductos().length === 0) {
      alert('⚠️ El carrito está vacío.');
      return;
    }
    this.router.navigate(['/kiosko/pago']);
  }
}