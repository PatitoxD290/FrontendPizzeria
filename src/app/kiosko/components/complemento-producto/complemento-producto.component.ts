import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ProductoService } from '../../../core/services/producto.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { ComplementoService } from '../../../core/services/complemento.service';
import { Producto, ProductoTamano } from '../../../core/models/producto.model';
import { CategoriaProducto } from '../../../core/models/categoria.model';
import { ModalStateService } from '../../../core/services/modal-state.service'; // ✅ Nuevo import


interface ProductoConTamanos {
  ID_Producto: number;
  Nombre: string;
  Descripcion: string;
  ID_Categoria_P: number;
  nombre_categoria?: string;
  imagen: string;
  tamanos?: ProductoTamano[];
}

@Component({
  selector: 'app-complemento-producto',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDialogModule, MatIconModule],
  templateUrl: './complemento-producto.component.html',
  styleUrls: ['./complemento-producto.component.css']
})
export class ComplementoProductoComponent implements OnInit, OnDestroy {
  productosBebidas: ProductoConTamanos[] = [];
  cargando: boolean = true;
  categoriasBebidas: number[] = [];

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private carritoService: CarritoService,
    public complementoService: ComplementoService,
    public dialogRef: MatDialogRef<ComplementoProductoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private modalStateService: ModalStateService // ✅ Inyectar servicio
  ) {}

  ngOnInit(): void {
    // ✅ Notificar que el modal está abierto
    this.modalStateService.setModalAbierto(true);
    this.cargarCategoriasBebidas();
  }

  ngOnDestroy(): void {
    // ✅ Notificar que el modal se cerró
    this.modalStateService.setModalAbierto(false);
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

  private cargarCategoriasBebidas(): void {
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (categorias: CategoriaProducto[]) => {
        const categoriasBebidas = categorias.filter(categoria => 
          categoria.Nombre.toLowerCase().includes('bebida')
        );
        
        this.categoriasBebidas = categoriasBebidas.map(cat => cat.ID_Categoria_P);
        this.cargarBebidas();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.cargarBebidas();
      }
    });
  }

  private cargarBebidas(): void {
    this.productoService.getProductos().subscribe({
      next: async (data: any) => {
        const rawArray = Array.isArray(data) ? data : data ? [data] : [];
        
        const productosActivos = rawArray.filter((item: any) => {
          const esBebida = this.categoriasBebidas.includes(item.ID_Categoria_P);
          const tieneTamanosActivos = item.tamanos && 
            item.tamanos.some((t: ProductoTamano) => t.Estado === 'A');
          
          return item.Estado === 'A' && esBebida && tieneTamanosActivos;
        });

        const productosPromesas = productosActivos.map(async (item: any) => ({
          ID_Producto: item.ID_Producto ?? 0,
          Nombre: item.Nombre ?? 'Sin nombre',
          Descripcion: item.Descripcion ?? '',
          ID_Categoria_P: item.ID_Categoria_P ?? 0,
          nombre_categoria: item.nombre_categoria || '',
          imagen: await this.verificarImagenProducto(
            `http://localhost:3000/imagenesCata/producto_${item.ID_Producto ?? 0}_1`
          ),
          tamanos: item.tamanos?.filter((t: ProductoTamano) => t.Estado === 'A') || [],
        }));

        this.productosBebidas = await Promise.all(productosPromesas);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar bebidas:', err);
        this.cargando = false;
        this.productosBebidas = [];
      },
    });
  }

  toggleComplemento(producto: ProductoConTamanos): void {
    const primerTamano = producto.tamanos && producto.tamanos.length > 0 
      ? producto.tamanos[0] 
      : null;

    if (!primerTamano) {
      return;
    }

    // ✅ Crear objeto complemento
    const complemento = {
      ID_Producto: producto.ID_Producto,
      ID_Producto_T: primerTamano.ID_Producto_T,
      nombre: producto.Nombre,
      descripcion: producto.Descripcion,
      precio: primerTamano.Precio,
      cantidad: 1,
      subtotal: primerTamano.Precio * 1,
      imagen: producto.imagen,
      nombre_tamano: primerTamano.nombre_tamano || 'Único',
      ID_Categoria_P: producto.ID_Categoria_P,
      esComplemento: true
    };

    // ✅ Toggle: agregar o quitar según si ya está seleccionado
    if (this.complementoService.estaSeleccionado(primerTamano.ID_Producto_T)) {
      this.complementoService.eliminarComplementoTemporal(primerTamano.ID_Producto_T);
    } else {
      this.complementoService.agregarComplementoTemporal(complemento);
    }
  }

  finalizarSeleccion(): void {
    // ✅ Cerrar el modal y enviar resultado
    this.dialogRef.close({ 
      complementosSeleccionados: true,
      cantidad: this.complementoService.obtenerCantidadComplementos()
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  // Método para obtener el precio del producto
  getPrecioProducto(producto: ProductoConTamanos): number {
    if (producto.tamanos && producto.tamanos.length > 0) {
      return producto.tamanos[0].Precio;
    }
    return 0;
  }

  // ✅ Método para verificar si un producto está seleccionado
  estaSeleccionado(producto: ProductoConTamanos): boolean {
    const primerTamano = producto.tamanos && producto.tamanos.length > 0 
      ? producto.tamanos[0] 
      : null;
    
    return primerTamano ? this.complementoService.estaSeleccionado(primerTamano.ID_Producto_T) : false;
  }
}