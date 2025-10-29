import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';  // 🔹 Import necesario para el icono

import { ProductoService } from '../../../../core/services/producto.service';
import { OrdenService } from '../../../../core/services/orden.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { Producto } from '../../../../core/models/producto.model';
import { CategoriaProducto } from '../../../../core/models/categoria.model';

import Swal from 'sweetalert2';
import { Tamano } from '../../../../core/models/tamano.model';
import { TamanoService } from '../../../../core/services/tamano.service'; 

import { MatDialog } from '@angular/material/dialog';
import { InfoTamanoComponent } from '../info-tamano/info-tamano.component';
import { PedidoDetalle } from '../../../../core/models/pedido.model';

@Component({
  selector: 'app-menu-pedido',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule  ],
  templateUrl: './menu-pedido.component.html',
  styleUrls: ['./menu-pedido.component.css']
})
export class MenuPedidoComponent implements OnInit {
  productos: (Producto & { nombre_categoria?: string })[] = [];
  productosFiltrados: (Producto & { nombre_categoria?: string })[] = [];
  categorias: CategoriaProducto[] = [];
  categoriaSeleccionada: number | null = null;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private ordenService: OrdenService,
    private tamanoService: TamanoService,
    private dialog: MatDialog 

  ) {}

  ngOnInit(): void {
    // Primero cargamos categorías y luego productos
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (cats) => {
        this.categorias = cats;
        this.cargarProductos();
      },
      error: (err) => console.error('Error cargando categorías:', err)
    });
  }

  cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data.map(p => ({
          ...p,
          nombre_categoria: this.obtenerNombreCategoria(p.ID_Categoria_P)
        }));
        this.productosFiltrados = [...this.productos]; // Mostrar todos al inicio
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  obtenerNombreCategoria(id: number): string {
    const categoria = this.categorias.find(c => c.ID_Categoria_P === id);
    return categoria ? categoria.Nombre : 'Sin categoría';
  }

  filtrarPorCategoria(id: number | null): void {
    this.categoriaSeleccionada = id;
    if (id === null) {
      this.productosFiltrados = [...this.productos];
    } else {
      this.productosFiltrados = this.productos.filter(p => p.ID_Categoria_P === id);
    }
  }

  agregarAlCarrito(prod: Producto) {
  const dialogRef = this.dialog.open(InfoTamanoComponent, {
    width: '400px',
    data: prod
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      const detalle: PedidoDetalle = {
        ID_Pedido_D: 0,
        ID_Pedido: 0,
        ID_Producto: prod.ID_Producto,
        ID_Tamano: result.ID_Tamano,
        Cantidad: result.Cantidad,
        PrecioTotal: result.PrecioTotal,
        nombre_producto: prod.Nombre,
        nombre_categoria: prod.nombre_categoria || 'Sin categoría'
      };
      this.ordenService.agregarProducto(detalle as any); // ⚡ adaptamos al service
    }
  });
}
}
