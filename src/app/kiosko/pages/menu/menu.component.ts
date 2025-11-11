import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DetalleProductoComponent } from '../../components/detalle-producto/detalle-producto.component';
import { CarritoService } from '../../../core/services/carrito.service';
import { Router } from '@angular/router';
import { CarritoFlotanteComponent } from '../../components/carrito-flotante/carrito-flotante.component';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { CombosService } from '../../../core/services/combos.service';
import { Producto, ProductoTamano } from '../../../core/models/producto.model';

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
  precioMinimo?: number; // 🔹 NUEVO: Precio más bajo para mostrar
  precioMaximo?: number; // 🔹 NUEVO: Precio más alto para mostrar
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  filtroCategoria: string = '';
  productos: ProductoConTamanos[] = []; // 🔹 CAMBIO: Array de productos completos
  productosOriginales: ProductoConTamanos[] = [];
  CATEGORY_MAP: Record<number, string> = {};

  private categoriaListener: any;

  constructor(
    private dialog: MatDialog,
    public carritoService: CarritoService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private combosService: CombosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCategoriasDesdeService();
    
    // Escuchar eventos de cambio de categoría desde el header
    this.categoriaListener = (event: any) => {
      this.filtroCategoria = event.detail;
    };
    window.addEventListener('cambioCategoria', this.categoriaListener);
  }

  ngOnDestroy(): void {
    if (this.categoriaListener) {
      window.removeEventListener('cambioCategoria', this.categoriaListener);
    }
  }

  private cargarCategoriasDesdeService(): void {
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (data: any[]) => {
        if (Array.isArray(data)) {
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

  private cargarProductosYCombos(): void {
    this.productoService.getProductos().subscribe({
      next: async (data: any) => {
        const rawArray = Array.isArray(data) ? data : data ? [data] : [];
        
        // 🔹 FILTRAR PRODUCTOS ACTIVOS QUE TENGAN TAMAÑOS ACTIVOS
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

        this.combosService.getCombos().subscribe({
          next: async (combos: any[]) => {
            const combosActivos = combos.filter(
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
                Nombre: item.Nombre ?? 'Combo sin nombre',
                Descripcion: item.Descripcion ?? '',
                ID_Categoria_P: 999,
                nombre_categoria: 'Combos',
                imagen: await this.verificarImagenProducto(
                  `http://localhost:3000/imagenesCata/combo_${item.ID_Combo ?? 0}_1`
                ),
                tamanos: [], // Combos no tienen tamaños
                esCombo: true,
                detallesTexto,
                precioMinimo: Number(item.Precio ?? 0),
                precioMaximo: Number(item.Precio ?? 0)
              };
            });

            const combosMapeados = await Promise.all(combosPromesas);
            this.productos = [...productosConTamanos, ...combosMapeados];
            this.productosOriginales = [...this.productos];
          },
          error: (err) => {
            console.error('Error al cargar combos:', err);
            this.productos = [...productosConTamanos];
            this.productosOriginales = [...productosConTamanos];
          },
        });
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.productos = [];
      },
    });
  }

  getNombreCategoria(id: number): string {
    return this.CATEGORY_MAP[id] ?? `Categoría ${id}`;
  }

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

  // 🔹 MÉTODO PARA MOSTRAR RANGO DE PRECIOS
  obtenerRangoPrecios(producto: ProductoConTamanos): string {
    if (producto.esCombo) {
      return `S/. ${producto.precioMinimo?.toFixed(2)}`;
    }
    
    if (producto.precioMinimo === producto.precioMaximo) {
      return `S/. ${producto.precioMinimo?.toFixed(2)}`;
    }
    
    return `S/. ${producto.precioMinimo?.toFixed(2)} - S/. ${producto.precioMaximo?.toFixed(2)}`;
  }

  abrirPersonalizacion(producto: ProductoConTamanos): void {
    this.dialog.open(DetalleProductoComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: producto,
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
  }
}