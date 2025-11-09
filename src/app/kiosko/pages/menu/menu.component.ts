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

interface ProductoConTamanos {
  ID_Producto: number;
  Nombre: string;
  Descripcion: string;
  ID_Categoria_P: number;
  nombre_categoria?: string;
  imagen: string;
  tamanos?: ProductoTamano[];
  detallesTexto?: string;
}

// 🔹 NUEVA INTERFACE PARA MOSTRAR CADA TAMAÑO COMO PRODUCTO INDIVIDUAL
interface ProductoItem {
  ID_Producto: number;
  ID_Producto_T: number; // ID único del tamaño
  Nombre: string;
  Descripcion: string;
  ID_Categoria_P: number;
  nombre_categoria: string;
  imagen: string;
  tamano: string;
  precio: number;
  esCombo: boolean;
  detallesTexto?: string;
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
  productos: ProductoItem[] = []; // 🔹 CAMBIO: Ahora es array de ProductoItem
  productosOriginales: ProductoItem[] = [];
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
        
        // 🔹 CORRECCIÓN: Filtrar productos activos y que tengan tamaños activos
        const productosActivos = rawArray.filter(
          (item: any) => item.Estado === 'A' && item.tamanos && item.tamanos.some((t: ProductoTamano) => t.Estado === 'A')
        );

        // 🔹 NUEVO: Crear un producto por cada tamaño activo
        const productosConTamanos: ProductoItem[] = [];

        for (const producto of productosActivos) {
          const tamanosActivos = producto.tamanos.filter((t: ProductoTamano) => t.Estado === 'A');
          const imagen = await this.verificarImagenProducto(
            `http://localhost:3000/imagenesCata/producto_${producto.ID_Producto ?? 0}_1`
          );
          const nombreCategoria = this.CATEGORY_MAP[producto.ID_Categoria_P] || 'Sin categoría';

          // 🔹 CREAR UN PRODUCTO POR CADA TAMAÑO ACTIVO
          for (const tamano of tamanosActivos) {
            const productoItem: ProductoItem = {
              ID_Producto: producto.ID_Producto,
              ID_Producto_T: tamano.ID_Producto_T, // ID único del tamaño
              Nombre: producto.Nombre ?? 'Sin nombre',
              Descripcion: producto.Descripcion ?? '',
              ID_Categoria_P: producto.ID_Categoria_P,
              nombre_categoria: nombreCategoria,
              imagen: imagen,
              tamano: tamano.nombre_tamano || 'Estándar',
              precio: tamano.Precio,
              esCombo: false
            };
            productosConTamanos.push(productoItem);
          }
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
                ID_Producto_T: item.ID_Combo ?? 0, // Para combos, usar ID_Combo como ID único
                Nombre: item.Nombre ?? 'Combo sin nombre',
                Descripcion: item.Descripcion ?? '',
                ID_Categoria_P: 999,
                nombre_categoria: 'Combos',
                imagen: await this.verificarImagenProducto(
                  `http://localhost:3000/imagenesCata/combo_${item.ID_Combo ?? 0}_1`
                ),
                tamano: 'Combo',
                precio: Number(item.Precio ?? 0),
                esCombo: true,
                detallesTexto
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

  get productosFiltrados(): ProductoItem[] {
    return this.productos.filter((p) => {
      const coincideCategoria = this.filtroCategoria
        ? p.nombre_categoria === this.filtroCategoria
        : true;
      const coincideBusqueda = this.searchTerm
        ? p.Nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          p.Descripcion.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          p.tamano.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
      return coincideCategoria && coincideBusqueda;
    });
  }

  abrirPersonalizacion(producto: ProductoItem): void {
    // 🔹 ADAPTAR PARA ENVIAR DATOS COMPLETOS AL DIALOGO
    const productoParaDialogo = {
      ID_Producto: producto.ID_Producto,
      Nombre: producto.Nombre,
      Descripcion: producto.Descripcion,
      ID_Categoria_P: producto.ID_Categoria_P,
      nombre_categoria: producto.nombre_categoria,
      imagen: producto.imagen,
      tamanos: [{
        ID_Producto_T: producto.ID_Producto_T,
        ID_Producto: producto.ID_Producto,
        ID_Tamano: 0, // Este valor no es crítico para el diálogo
        Precio: producto.precio,
        Estado: 'A',
        Fecha_Registro: '',
        nombre_tamano: producto.tamano
      }],
      detallesTexto: producto.detallesTexto
    };

    this.dialog.open(DetalleProductoComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: productoParaDialogo,
    });
  }

  calcularTotalCarrito(): number {
    return this.carritoService
      .obtenerProductos()
      .reduce((total, item) => total + item.Precio * item.Cantidad!, 0);
  }

  confirmarPedido(): void {
    if (this.carritoService.obtenerProductos().length === 0) {
      alert('⚠️ El carrito está vacío.');
      return;
    }
    this.router.navigate(['/kiosko/pago']);
  }
}