import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DetalleProductoComponent } from '../../components/detalle-producto/detalle-producto.component';
import { CarritoService } from '../../../core/services/auth/carrito.service';
import { Router } from '@angular/router';
import { CarritoFlotanteComponent } from '../../components/carrito-flotante/carrito-flotante.component';
import { ProductoService } from '../../../core/services/auth/producto.service';
import { CategoriaService } from '../../../core/services/auth/categoria.service';
import { CombosService } from '../../../core/services/auth/combos.service';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: number;
  precio: number;
  imagen: string;
  cantidad?: number;
  detallesTexto?: string; // 👈 Para combos
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    CarritoFlotanteComponent,
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit {
  searchTerm: string = '';
  filtroCategoria: string = '';
  productos: Producto[] = [];
  productosOriginales: Producto[] = [];

  CATEGORY_MAP: Record<number, string> = {};
  categorias: { id: number; nombre: string }[] = [];

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
  }

  // ✅ Cargar categorías + agregar "Combos"
  private cargarCategoriasDesdeService(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: any[]) => {
        if (Array.isArray(data)) {
          this.CATEGORY_MAP = data.reduce((acc, item) => {
            acc[item.ID_Categoria_P] = item.Nombre ?? `Categoría ${item.ID_Categoria_P}`;
            return acc;
          }, {} as Record<number, string>);

          this.categorias = data.map((item) => ({
            id: item.ID_Categoria_P,
            nombre: item.Nombre ?? `Categoría ${item.ID_Categoria_P}`,
          }));

          // Agregamos manualmente la categoría "Combos"
          const existeCombos = this.categorias.some(
            (c) => c.nombre.toLowerCase() === 'combos'
          );
          if (!existeCombos) {
            this.categorias.push({ id: 999, nombre: 'Combos' });
            this.CATEGORY_MAP[999] = 'Combos';
          }
        }

        this.cargarProductosYCombos();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.CATEGORY_MAP = {};
        this.categorias = [{ id: 999, nombre: 'Combos' }];
        this.CATEGORY_MAP[999] = 'Combos';
        this.cargarProductosYCombos();
      },
    });
  }

  // ✅ Cargar productos y combos combinados
  private cargarProductosYCombos(): void {
    this.productoService.getProductos().subscribe({
      next: (data: any) => {
        const rawArray = Array.isArray(data) ? data : data ? [data] : [];
        const productosActivos = rawArray.filter(
          (item: any) => item.estado === 'A' || item.estado === undefined
        );

        const productosMapeados = productosActivos.map((item: any) => ({
          id: item.ID_Producto ?? item.id ?? 0,
          nombre: item.Nombre ?? 'Sin nombre',
          descripcion: item.Descripcion ?? '',
          categoria: item.ID_Categoria_P ?? 0,
          precio: Number(item.Precio_Base ?? 0) || 0,
          imagen: `http://localhost:3000/imagenesCata/producto_${
            item.ID_Producto ?? 0
          }_1.png`,
        }));

        // Ahora cargamos los combos y los unimos
        this.combosService.getCombos().subscribe({
          next: (combos: any[]) => {
            const combosActivos = combos.filter(
              (item) => item.Estado === 'A' || item.estado === 'A'
            );

            const combosMapeados = combosActivos.map((item: any) => {
              const detallesTexto = Array.isArray(item.detalles)
                ? item.detalles
                    .map(
                      (d: any) =>
                        `${d.Producto_Nombre ?? ''} (${d.Tamano_Nombre ?? ''}) x${d.Cantidad ?? 1}`
                    )
                    .join(', ')
                : '';

              return {
                id: item.ID_Combo ?? 0,
                nombre: item.Nombre ?? 'Combo sin nombre',
                descripcion: item.Descripcion ?? '',
                categoria: 999, // Combos
                precio: Number(item.Precio ?? 0),
                imagen: `http://localhost:3000/imagenesCata/combo_${
                  item.ID_Combo ?? 0
                }_1.png`,
                detallesTexto,
              };
            });

            // ✅ Unimos productos + combos
            this.productos = [...productosMapeados, ...combosMapeados];
            this.productosOriginales = [...this.productos];
          },
          error: (err) => {
            console.error('Error al cargar combos:', err);
            this.productos = [...productosMapeados];
            this.productosOriginales = [...productosMapeados];
          },
        });
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.productos = [];
      },
    });
  }

  // 🧭 Obtener nombre de categoría
  getNombreCategoria(id: number): string {
    return this.CATEGORY_MAP[id] ?? `Categoría ${id}`;
  }

  // 🧩 Obtener ícono de categoría
  getIconoCategoria(nombre: string): string {
    const lower = nombre.toLowerCase();
    if (lower.includes('pizza')) return 'local_pizza';
    if (lower.includes('bebida')) return 'local_drink';
    if (lower.includes('combo')) return 'fastfood';
    return 'category';
  }

  // 🔍 Filtrar productos
  get productosFiltrados(): Producto[] {
    return this.productos.filter((p) => {
      const categoriaNombre = this.getNombreCategoria(p.categoria);
      const coincideCategoria = this.filtroCategoria
        ? categoriaNombre === this.filtroCategoria
        : true;
      const coincideBusqueda = this.searchTerm
        ? p.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
      return coincideCategoria && coincideBusqueda;
    });
  }

  cambiarCategoria(categoria: string): void {
    this.filtroCategoria = categoria;
  }

  get mostrarFiltrosInferiores(): boolean {
    return this.filtroCategoria !== 'Bebidas';
  }

  agregarAlCarrito(producto: Producto): void {
    this.carritoService.agregarProducto({ ...producto, cantidad: 1 });
  }

  abrirPersonalizacion(producto: Producto): void {
    const dialogRef = this.dialog.open(DetalleProductoComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: producto,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.agregar) {
        this.carritoService.agregarProducto({
          ...producto,
          ...result.producto,
          cantidad: 1,
        });
      }
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
