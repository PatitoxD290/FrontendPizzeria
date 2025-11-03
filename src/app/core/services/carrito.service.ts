import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private productos: any[] = [];

  /** 🛒 Agregar un producto al carrito */
  agregarProducto(producto: any) {
    // Buscar por nombre + tamaño
    const existente = this.productos.find(
      p => p.nombre === producto.nombre && p.idTamano === producto.idTamano
    );

    if (existente) {
      // Si ya existe, sumar cantidad y recalcular subtotal
      existente.cantidad += producto.cantidad;
      existente.subtotal = existente.precio * existente.cantidad;
    } else {
      producto.subtotal = producto.precio * producto.cantidad;
      this.productos.push({ ...producto });
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
    return this.productos.reduce((sum, item) => sum + item.subtotal, 0);
  }

  /** 🔢 Obtener número total de ítems distintos */
  obtenerCantidadItems(): number {
    return this.productos.length;
  }
}
