import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private productos: any[] = [];

  /** 🛒 Agregar un producto al carrito */
  agregarProducto(producto: any) {
    // 🔹 Buscar por ID único (ID_Producto_T)
    const existente = this.productos.find(
      p => p.ID_Producto_T === producto.ID_Producto_T
    );

    if (existente) {
      // 🔹 CORRECCIÓN: REEMPLAZAR la cantidad en lugar de SUMAR
      existente.cantidad += producto.cantidad; 
      existente.subtotal = existente.precio * existente.cantidad;
    } else {
      // Crear nuevo producto
      const productoCarrito = {
        ...producto,
        precio: producto.precio || producto.Precio,
        subtotal: producto.subtotal || (producto.precio || producto.Precio) * producto.cantidad
      };
      this.productos.push(productoCarrito);
    }
  }

  /** 📦 Obtener todos los productos */
  obtenerProductos() {
    return this.productos;
  }

  /** ❌ Eliminar un producto específico */
  eliminarProducto(index: number) {
    this.productos.splice(index, 1);
  }

  /** ➕ Incrementar la cantidad de un producto */
  incrementarCantidad(index: number) {
    this.productos[index].cantidad++;
    this.productos[index].subtotal = this.productos[index].precio * this.productos[index].cantidad;
  }

  /** ➖ Decrementar la cantidad de un producto */
  decrementarCantidad(index: number) {
    if (this.productos[index].cantidad > 1) {
      this.productos[index].cantidad--;
      this.productos[index].subtotal = this.productos[index].precio * this.productos[index].cantidad;
    } else {
      this.eliminarProducto(index);
    }
  }

  /** 🧹 Vaciar todo el carrito */
  vaciarCarrito() {
    this.productos = [];
  }

  /** 🧮 Calcular el total del carrito */
  obtenerTotal(): number {
    return this.productos.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  /** 🔢 Obtener número total de ítems distintos */
  obtenerCantidadItems(): number {
    return this.productos.length;
  }
}