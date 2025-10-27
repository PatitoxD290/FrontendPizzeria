import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ProductoService } from '../../../../core/services/producto.service';
import { OrdenService } from '../../../../core/services/orden.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { Producto } from '../../../../core/models/producto.model';
import { CategoriaProducto } from '../../../../core/models/categoria.model';

@Component({
  selector: 'app-menu-pedido',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './menu-pedido.component.html',
  styleUrls: ['./menu-pedido.component.css']
})
export class MenuPedidoComponent implements OnInit {
  productos: (Producto & { nombre_categoria?: string })[] = [];
  categorias: CategoriaProducto[] = [];

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private ordenService: OrdenService
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
        // Combinar producto con su nombre de categoría
        this.productos = data.map(p => ({
          ...p,
          nombre_categoria: this.obtenerNombreCategoria(p.id_categoria_p)
        }));
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  obtenerNombreCategoria(id: number): string {
    const categoria = this.categorias.find(c => c.id_categoria_p === id);
    return categoria ? categoria.nombre : 'Sin categoría';
  }

  agregarAlCarrito(prod: Producto) {
    this.ordenService.agregarProducto(prod);
  }
}
