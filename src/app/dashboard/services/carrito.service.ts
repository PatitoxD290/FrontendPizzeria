import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from '../../core/models/producto.model';
import { DetallePedido } from '../../core/models/detalle-pedido.model';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private detalles: DetallePedido[] = [];
  private detallesSubject = new BehaviorSubject<DetallePedido[]>([]);
  detalles$ = this.detallesSubject.asObservable();

  agregarProducto(producto: Producto & { nombre_categoria?: string }) {
    const existente = this.detalles.find(d => d.producto_id === producto.producto_id);

    if (existente) {
      existente.cantidad += 1;
      existente.subtotal = existente.cantidad * existente.precio_unitario;
    } else {
      const nuevo: DetallePedido = {
        detalle_pedido_id: 0,
        pedido_id: 0,
        producto_id: producto.producto_id!,
        tamano_id: null,
        cantidad: 1,
        precio_unitario: producto.precio_venta,
        subtotal: producto.precio_venta,
        notas_producto: null,
        nombre_producto: producto.nombre_producto,
        nombre_categoria: producto.nombre_categoria || 'Sin categoría'
      };
      this.detalles.push(nuevo);
    }

    this.detallesSubject.next([...this.detalles]);
  }

  eliminarProducto(id: number) {
    this.detalles = this.detalles.filter(p => p.producto_id !== id);
    this.detallesSubject.next([...this.detalles]);
  }

  limpiar() {
    this.detalles = [];
    this.detallesSubject.next([...this.detalles]);
  }

  // 🔹 NUEVOS MÉTODOS PÚBLICOS
  aumentarCantidad(id: number) {
    const detalle = this.detalles.find(d => d.producto_id === id);
    if (detalle) {
      detalle.cantidad += 1;
      detalle.subtotal = detalle.cantidad * detalle.precio_unitario;
      this.detallesSubject.next([...this.detalles]);
    }
  }

  reducirCantidad(id: number) {
    const detalle = this.detalles.find(d => d.producto_id === id);
    if (detalle && detalle.cantidad > 1) {
      detalle.cantidad -= 1;
      detalle.subtotal = detalle.cantidad * detalle.precio_unitario;
      this.detallesSubject.next([...this.detalles]);
    }
  }
}