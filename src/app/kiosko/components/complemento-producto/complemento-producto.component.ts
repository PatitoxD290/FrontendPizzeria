import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { ComplementoService, ComplementoUI } from '../../../core/services/complemento.service';
import { Producto } from '../../../core/models/producto.model';
import { CategoriaProducto } from '../../../core/models/categoria.model';
import { ModalStateService } from '../../../core/services/modal-state.service';

// 🔹 INTERFAZ: Representa cada producto_tamano como elemento individual
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
  imports: [
    CommonModule, 
    MatCardModule, 
    MatDialogModule, 
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './complemento-producto.component.html',
  styleUrls: ['./complemento-producto.component.css']
})
export class ComplementoProductoComponent implements OnInit, OnDestroy {
  
  // 🔹 CAMBIO: Ahora almacenamos productos_tamano individuales
  productosTamanoBebidas: ProductoTamanoCompleto[] = [];
  cargando: boolean = true;
  categoriasBebidas: number[] = [];
  private baseUrl = 'http://localhost:3000';

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
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

  private cargarCategoriasBebidas(): void {
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (categorias: CategoriaProducto[]) => {
        const categoriasBebidas = categorias.filter(categoria => 
          categoria.Nombre.toLowerCase().includes('bebida') || 
          categoria.Nombre.toLowerCase().includes('refresco') ||
          categoria.Nombre.toLowerCase().includes('jugo')
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
    next: (productos: Producto[]) => {
      const productosTamanoActivos: ProductoTamanoCompleto[] = [];

      for (const item of productos) {
        // Verificar si es bebida y está activo
        const esBebida = this.categoriasBebidas.includes(item.ID_Categoria_P);
        const estaActivo = item.Estado === 'A';
        
        if (esBebida && estaActivo && item.tamanos) {
          // 🔹 CORREGIDO: Usar la misma lógica que menu.component
          let imagenUrl = 'assets/imgs/logo.png';
          
          // Intentar construir URL de imagen similar a menu.component
          const urlBase = `http://localhost:3000/imagenesCata/producto_${item.ID_Producto}_1`;
          // Verificar extensiones como en menu.component
          const extensiones = ['png', 'jpg', 'jpeg'];
          
          // Usar imagen del item si existe y es válida
          if (item.imagenes && item.imagenes.length > 0) {
            const filename = item.imagenes[0].split(/[/\\]/).pop();
            imagenUrl = `${this.baseUrl}/imagenesCata/${filename}`;
          } else {
            // Si no hay imagen en el array, usar la lógica de verificación
            imagenUrl = urlBase + '.png'; // Asumir PNG por defecto
          }

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
                Nombre: item.Nombre,
                Descripcion: item.Descripcion,
                ID_Categoria_P: item.ID_Categoria_P,
                nombre_categoria: item.nombre_categoria || '',
                imagen: imagenUrl
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
    // Preparar objeto compatible con ComplementoUI
    const complemento: ComplementoUI = {
      ID_Producto_T: productoTamano.ID_Producto_T,
      Nombre: `${productoTamano.Nombre} (${productoTamano.nombre_tamano})`,
      Precio: productoTamano.Precio,
      Cantidad: 1
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

  onImageError(event: any) {
    event.target.src = 'assets/imgs/logo.png';
  }
}