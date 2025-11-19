// carrito.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private productos: any[] = [];

  /** 🛒 Agregar un producto o combo al carrito */
agregarProducto(producto: any) {
  console.log('🛒 Recibiendo producto para agregar:', producto);

  // 🔹 NUEVO: Para complementos de combos, mantener la relación
  if (producto.esComplementoCombo && producto.ID_Combo_Asociado) {
    // Agregar directamente sin buscar duplicados (pueden haber múltiples complementos iguales)
    const productoCarrito = {
      ...producto,
      precio: producto.precio || producto.Precio,
      subtotal: producto.subtotal || (producto.precio || producto.Precio) * producto.cantidad
    };
    this.productos.push(productoCarrito);
    console.log('🛒 Complemento de combo agregado:', productoCarrito);
    return;
  }

  // El resto del método para combos y productos individuales se mantiene igual...
  // 🔹 PARA COMBOS: buscar por ID_Combo
  if (producto.esCombo && producto.ID_Combo) {
    const existente = this.productos.find(
      p => p.esCombo && p.ID_Combo === producto.ID_Combo && !p.esComplementoCombo
    );

    if (existente) {
      existente.cantidad += producto.cantidad;
      existente.subtotal = existente.precio * existente.cantidad;
      console.log('🛒 Combo existente actualizado:', existente);
    } else {
      const productoCarrito = {
        ...producto,
        precio: producto.precio || producto.Precio,
        subtotal: producto.subtotal || (producto.precio || producto.Precio) * producto.cantidad
      };
      this.productos.push(productoCarrito);
      console.log('🛒 Nuevo combo agregado:', productoCarrito);
    }
  } 
  // 🔹 PARA PRODUCTOS INDIVIDUALES: buscar por ID_Producto_T
  else if (producto.ID_Producto_T && !producto.esComplementoCombo) {
    const existente = this.productos.find(
      p => p.ID_Producto_T === producto.ID_Producto_T && !p.esComplementoCombo
    );

    if (existente) {
      existente.cantidad += producto.cantidad;
      existente.subtotal = existente.precio * existente.cantidad;
    } else {
      const productoCarrito = {
        ...producto,
        precio: producto.precio || producto.Precio,
        subtotal: producto.subtotal || (producto.precio || producto.Precio) * producto.cantidad
      };
      this.productos.push(productoCarrito);
    }
  }

  console.log('🛒 Carrito actual:', this.productos);
}

  // Los demás métodos se mantienen igual...
  obtenerProductos() {
    return this.productos;
  }

  eliminarProducto(index: number) {
    this.productos.splice(index, 1);
  }

  incrementarCantidad(index: number) {
    this.productos[index].cantidad++;
    this.productos[index].subtotal = this.productos[index].precio * this.productos[index].cantidad;
  }

  decrementarCantidad(index: number) {
    if (this.productos[index].cantidad > 1) {
      this.productos[index].cantidad--;
      this.productos[index].subtotal = this.productos[index].precio * this.productos[index].cantidad;
    } else {
      this.eliminarProducto(index);
    }
  }

  vaciarCarrito() {
    this.productos = [];
  }

  obtenerTotal(): number {
    return this.productos.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  obtenerCantidadItems(): number {
    return this.productos.length;
  }
}