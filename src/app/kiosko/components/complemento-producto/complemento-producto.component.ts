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
import { ModalStateService } from '../../../core/services/modal-state.service';

// 🔹 NUEVA INTERFAZ: Representa cada producto_tamano como elemento individual
interface ProductoTamanoCompleto {
  ID_Producto_T: number;
  ID_Producto: number;
  ID_Tamano: number;
  Precio: number;
  Estado: 'A' | 'I';
  nombre_tamano: string;
  
  // Datos del producto padre
  Nombre: string;
  Descripcion: string;
  ID_Categoria_P: number;
  nombre_categoria: string;
  imagen: string;
}

@Component({
  selector: 'app-complemento-producto',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDialogModule, MatIconModule],
  templateUrl: './complemento-producto.component.html',
  styleUrls: ['./complemento-producto.component.css']
})
export class ComplementoProductoComponent implements OnInit, OnDestroy {
  // 🔹 CAMBIO: Ahora almacenamos productos_tamano individuales
  productosTamanoBebidas: ProductoTamanoCompleto[] = [];
  cargando: boolean = true;
  categoriasBebidas: number[] = [];

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private carritoService: CarritoService,
    public complementoService: ComplementoService,
    public dialogRef: MatDialogRef<ComplementoProductoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private modalStateService: ModalStateService
  ) {}

  ngOnInit(): void {
    this.modalStateService.abrirModal();
    this.cargarCategoriasBebidas();
  }

  ngOnDestroy(): void {
    this.modalStateService.cerrarModal();
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
        this.cargarProductosTamanoBebidas();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.cargarProductosTamanoBebidas();
      }
    });
  }

  // 🔹 CAMBIO COMPLETO: Cargar productos_tamano individuales
  private cargarProductosTamanoBebidas(): void {
    this.productoService.getProductos().subscribe({
      next: async (data: any) => {
        const rawArray = Array.isArray(data) ? data : data ? [data] : [];
        
        const productosTamanoActivos: ProductoTamanoCompleto[] = [];

        for (const item of rawArray) {
          // Verificar si es bebida y está activo
          const esBebida = this.categoriasBebidas.includes(item.ID_Categoria_P);
          const estaActivo = item.Estado === 'A';
          
          if (esBebida && estaActivo && item.tamanos) {
            // Obtener imagen del producto
            const imagen = await this.verificarImagenProducto(
              `http://localhost:3000/imagenesCata/producto_${item.ID_Producto ?? 0}_1`
            );

            // Crear un elemento por cada tamaño activo
            for (const tamano of item.tamanos) {
              if (tamano.Estado === 'A') {
                productosTamanoActivos.push({
                  // Datos del producto_tamano
                  ID_Producto_T: tamano.ID_Producto_T,
                  ID_Producto: item.ID_Producto,
                  ID_Tamano: tamano.ID_Tamano,
                  Precio: tamano.Precio,
                  Estado: tamano.Estado,
                  nombre_tamano: tamano.nombre_tamano || 'Estándar',
                  
                  // Datos del producto padre
                  Nombre: item.Nombre ?? 'Sin nombre',
                  Descripcion: item.Descripcion ?? '',
                  ID_Categoria_P: item.ID_Categoria_P ?? 0,
                  nombre_categoria: item.nombre_categoria || '',
                  imagen: imagen
                });
              }
            }
          }
        }

        this.productosTamanoBebidas = productosTamanoActivos;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar productos-tamaño:', err);
        this.cargando = false;
        this.productosTamanoBebidas = [];
      },
    });
  }

  // 🔹 CAMBIO: Seleccionar producto_tamano individual
  toggleProductoTamano(productoTamano: ProductoTamanoCompleto): void {
    const complemento = {
      ID_Producto: productoTamano.ID_Producto,
      ID_Producto_T: productoTamano.ID_Producto_T,
      nombre: productoTamano.Nombre,
      descripcion: productoTamano.Descripcion,
      precio: productoTamano.Precio,
      cantidad: 1,
      subtotal: productoTamano.Precio * 1,
      imagen: productoTamano.imagen,
      nombre_tamano: productoTamano.nombre_tamano,
      ID_Categoria_P: productoTamano.ID_Categoria_P,
      esComplemento: true
    };

    if (this.complementoService.estaSeleccionado(productoTamano.ID_Producto_T)) {
      this.complementoService.eliminarComplementoTemporal(productoTamano.ID_Producto_T);
    } else {
      this.complementoService.agregarComplementoTemporal(complemento);
    }
  }

  // 🔹 CAMBIO: Verificar si un producto_tamano está seleccionado
  estaSeleccionado(productoTamano: ProductoTamanoCompleto): boolean {
    return this.complementoService.estaSeleccionado(productoTamano.ID_Producto_T);
  }

  finalizarSeleccion(): void {
    this.dialogRef.close({ 
      complementosSeleccionados: true,
      cantidad: this.complementoService.obtenerCantidadComplementos()
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}