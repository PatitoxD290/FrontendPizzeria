import { Injectable } from '@angular/core';
import { DatosPedido } from '../models/pedido.model'; // Asegúrate de importar el modelo

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  // 🟢 Usamos el modelo DatosPedido en lugar de any[]
  private productos: DatosPedido[] = [];

  /** 🛒 Agregar un producto o combo al carrito */
  agregarProducto(item: any) {
    console.log('🛒 Recibiendo item:', item);

    // Normalizar el objeto al modelo DatosPedido
    const nuevoItem: DatosPedido = {
      id: Date.now() + Math.random(), // ID temporal único para el frontend
      
      // IDs Reales para el Backend
      idProductoT: item.ID_Producto_T || null,
      idCombo: item.ID_Combo || null,
      
      // Datos Visuales
      nombre: item.Nombre || item.nombre || 'Ítem sin nombre',
      cantidad: item.cantidad || 1,
      precioUnitario: Number(item.Precio || item.precio || 0),
      precioTotal: 0, // Se calcula abajo
      
      tamano: item.nombre_tamano || item.tamano || '',
      esCombo: !!item.esCombo || !!item.ID_Combo, // Detectar si es combo
      descripcion: item.Descripcion || ''
    };

    // Calcular subtotal inicial
    nuevoItem.precioTotal = nuevoItem.precioUnitario * nuevoItem.cantidad;

    // 1. LÓGICA PARA COMBOS (Se agrupan por ID de Combo)
    if (nuevoItem.esCombo && nuevoItem.idCombo) {
      const existente = this.productos.find(p => p.esCombo && p.idCombo === nuevoItem.idCombo);

      if (existente) {
        existente.cantidad += nuevoItem.cantidad;
        existente.precioTotal = existente.precioUnitario * existente.cantidad;
        console.log('🛒 Combo actualizado:', existente);
      } else {
        this.productos.push(nuevoItem);
        console.log('🛒 Nuevo combo agregado:', nuevoItem);
      }
    } 
    // 2. LÓGICA PARA PRODUCTOS (Se agrupan por ID_Producto_T, que es Producto+Tamaño)
    else if (nuevoItem.idProductoT) {
      const existente = this.productos.find(p => !p.esCombo && p.idProductoT === nuevoItem.idProductoT);

      if (existente) {
        existente.cantidad += nuevoItem.cantidad;
        existente.precioTotal = existente.precioUnitario * existente.cantidad;
        console.log('🛒 Producto actualizado:', existente);
      } else {
        this.productos.push(nuevoItem);
        console.log('🛒 Nuevo producto agregado:', nuevoItem);
      }
    } else {
        console.warn('⚠️ Ítem inválido: no tiene ID de producto ni de combo', item);
    }

    console.log('🛒 Carrito actual:', this.productos);
  }

  // Obtener lista
  obtenerProductos(): DatosPedido[] {
    return this.productos;
  }

  // Eliminar
  eliminarProducto(index: number) {
    this.productos.splice(index, 1);
  }

  // +1 Cantidad
  incrementarCantidad(index: number) {
    const item = this.productos[index];
    item.cantidad++;
    item.precioTotal = item.precioUnitario * item.cantidad;
  }

  // -1 Cantidad
  decrementarCantidad(index: number) {
    const item = this.productos[index];
    if (item.cantidad > 1) {
      item.cantidad--;
      item.precioTotal = item.precioUnitario * item.cantidad;
    } else {
      this.eliminarProducto(index);
    }
  }

  vaciarCarrito() {
    this.productos = [];
  }

  // Calcular Total General
  obtenerTotal(): number {
    return this.productos.reduce((sum, item) => sum + item.precioTotal, 0);
  }

  obtenerCantidadItems(): number {
    return this.productos.length;
  }
}