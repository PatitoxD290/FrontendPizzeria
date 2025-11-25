import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PedidoDetalle } from '../models/pedido.model';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private detalles: PedidoDetalle[] = [];
  private detallesSubject = new BehaviorSubject<PedidoDetalle[]>([]);
  
  // Observable para que los componentes se suscriban
  detalles$ = this.detallesSubject.asObservable();

  constructor() {}

  // ==========================================
  // 🟩 AGREGAR (Producto o Combo)
  // ==========================================
agregarProducto(detalle: PedidoDetalle) {
  console.log('🔄 Recibiendo detalle en orden.service:', detalle);
  
  // Validar PrecioTotal
  if (!detalle.PrecioTotal || detalle.PrecioTotal <= 0) {
    console.error('❌ ERROR: PrecioTotal inválido o cero:', detalle);
    Swal.fire({
      icon: 'error',
      title: 'Error en precio',
      text: 'El precio del producto no es válido. Por favor, selecciona el producto nuevamente.',
      confirmButtonColor: '#1976d2'
    });
    return;
  }

  // Validar PrecioTotal
  if (!detalle.PrecioTotal || detalle.PrecioTotal <= 0) {
    console.error('❌ PrecioTotal inválido en detalle:', detalle);
    Swal.fire({
      icon: 'error',
      title: 'Precio inválido',
      text: 'El precio del item no es válido.',
      confirmButtonColor: '#1976d2'
    });
    return;
  }

  const esCombo = !!detalle.ID_Combo;
  const idBusqueda = esCombo ? detalle.ID_Combo : detalle.ID_Producto_T;

  if (!idBusqueda) {
    console.error('Error: El detalle no tiene ID de Producto ni de Combo');
    return;
  }

  // Buscar si ya existe en la lista
  const existente = this.detalles.find(d => {
    if (esCombo) {
      return d.ID_Combo === idBusqueda;
    } else {
      return d.ID_Producto_T === idBusqueda && !d.ID_Combo;
    }
  });

  if (existente) {
    // Calcular precio unitario basado en el nuevo detalle
    const nuevoPrecioUnitario = detalle.PrecioTotal / detalle.Cantidad;
    existente.Cantidad += detalle.Cantidad;
    existente.PrecioTotal = nuevoPrecioUnitario * existente.Cantidad;
  } else {
    // Agregar nuevo
    this.detalles.push({ ...detalle });
  }

  this.actualizarEstado();
}

  // ==========================================
  // ⬆️ AUMENTAR CANTIDAD
  // ==========================================
  // Modificado para soportar Combos: se pide el ID y un flag booleano
  aumentarCantidad(id: number, esCombo: boolean, precioBase: number) {
    const detalle = this.buscarDetalle(id, esCombo);

    if (detalle) {
      detalle.Cantidad++;
      detalle.PrecioTotal = detalle.Cantidad * precioBase;
      this.actualizarEstado();
    }
  }

  // ==========================================
  // ⬇️ REDUCIR CANTIDAD
  // ==========================================
  reducirCantidad(id: number, esCombo: boolean, precioBase: number) {
    const detalle = this.buscarDetalle(id, esCombo);

    if (detalle) {
      if (detalle.Cantidad > 1) {
        detalle.Cantidad--;
        detalle.PrecioTotal = detalle.Cantidad * precioBase;
        this.actualizarEstado();
      } else {
        // Si es 1 y reducimos, se elimina
        this.eliminarProducto(id, esCombo);
      }
    }
  }

  // ==========================================
  // 🗑️ ELIMINAR ÍTEM
  // ==========================================
  eliminarProducto(id: number, esCombo: boolean) {
    this.detalles = this.detalles.filter(d => {
      if (esCombo) {
        return d.ID_Combo !== id;
      } else {
        return d.ID_Producto_T !== id;
      }
    });
    this.actualizarEstado();
  }

  // ==========================================
  // 🧹 LIMPIAR TODO
  // ==========================================
  limpiar() {
    this.detalles = [];
    this.actualizarEstado();
  }

  // ==========================================
  // 💰 TOTALES Y GETTERS
  // ==========================================
  
  obtenerTotal(): number {
    return this.detalles.reduce((acc, d) => acc + (Number(d.PrecioTotal) || 0), 0);
  }

  obtenerDetalles(): PedidoDetalle[] {
    return [...this.detalles];
  }

  obtenerCantidadItems(): number {
    return this.detalles.length;
  }

  // ==========================================
  // 🔧 PRIVADOS
  // ==========================================

  private buscarDetalle(id: number, esCombo: boolean): PedidoDetalle | undefined {
    return this.detalles.find(d => {
      if (esCombo) return d.ID_Combo === id;
      return d.ID_Producto_T === id && !d.ID_Combo;
    });
  }

  private actualizarEstado() {
    this.detallesSubject.next([...this.detalles]);
  }
}