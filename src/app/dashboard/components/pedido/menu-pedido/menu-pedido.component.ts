import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ProductoService } from '../../../services/producto.service';
import { CarritoService } from '../../../services/carrito.service';
import { CategoriaService } from '../../../services/categoria.service';
import { Producto } from '../../../../core/models/producto.model';
import { Categoria } from '../../../../core/models/categoria.model';

@Component({
  selector: 'app-menu-pedido',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './menu-pedido.component.html',
  styleUrls: ['./menu-pedido.component.css']
})
export class MenuPedidoComponent implements OnInit {
  productos: (Producto & { nombre_categoria?: string })[] = [];
  categorias: Categoria[] = [];

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private carritoService: CarritoService
  ) {}

  ngOnInit() {
    // Primero cargamos categorías y luego productos
    this.categoriaService.getCategorias().subscribe({
      next: (cats) => {
        this.categorias = cats;
        this.cargarProductos();
      },
      error: (err) => console.error('Error cargando categorías:', err)
    });
  }

  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        // Combinar producto con su nombre de categoría
        this.productos = data.map(p => ({
          ...p,
          nombre_categoria: this.obtenerNombreCategoria(p.categoria_id)
        }));
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  obtenerNombreCategoria(id: number): string {
    const categoria = this.categorias.find(c => c.categoria_id === id);
    return categoria ? categoria.nombre_categoria : 'Sin categoría';
  }

  agregarAlCarrito(prod: Producto) {
    this.carritoService.agregarProducto(prod);
  }
}
