// src/app/core/services/orden.service.ts
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
  detalles$ = this.detallesSubject.asObservable();

  constructor() {}

  // 🟩 Agregar producto al pedido
  agregarProducto(detalle: PedidoDetalle) {
    if (!detalle.Cantidad || detalle.Cantidad <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Cantidad inválida',
        text: 'No puedes agregar un producto con cantidad 0.',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    // 🔹 CAMBIO: Buscar por ID_Producto_T O ID_Combo
    const existente = this.detalles.find(d => 
      (detalle.ID_Producto_T && d.ID_Producto_T === detalle.ID_Producto_T) ||
      (detalle.ID_Combo && d.ID_Combo === detalle.ID_Combo)
    );

    if (existente) {
      existente.Cantidad += detalle.Cantidad;
      existente.PrecioTotal += detalle.PrecioTotal;
    } else {
      this.detalles.push({ ...detalle });
    }

    this.detallesSubject.next([...this.detalles]);
  }

  // ⬆️ Aumentar cantidad
  aumentarCantidad(idProductoTamano: number, idCombo: number, precioBase: number) {
    // 🔹 CORRECCIÓN: Asegurar que los IDs sean números válidos
    const idProducto = idProductoTamano || 0;
    const idComboVal = idCombo || 0;
    
    const detalle = this.detalles.find(d => 
      (idProducto > 0 && d.ID_Producto_T === idProducto) ||
      (idComboVal > 0 && d.ID_Combo === idComboVal)
    );
    
    if (detalle) {
      detalle.Cantidad++;
      detalle.PrecioTotal = detalle.Cantidad * precioBase;
      this.detallesSubject.next([...this.detalles]);
    }
  }

  reducirCantidad(idProductoTamano: number, idCombo: number, precioBase: number) {
    // 🔹 CORRECCIÓN: Asegurar que los IDs sean números válidos
    const idProducto = idProductoTamano || 0;
    const idComboVal = idCombo || 0;
    
    const detalle = this.detalles.find(d => 
      (idProducto > 0 && d.ID_Producto_T === idProducto) ||
      (idComboVal > 0 && d.ID_Combo === idComboVal)
    );
    
    if (detalle && detalle.Cantidad > 1) {
      detalle.Cantidad--;
      detalle.PrecioTotal = detalle.Cantidad * precioBase;
      this.detallesSubject.next([...this.detalles]);
    } else if (detalle && detalle.Cantidad === 1) {
      this.eliminarProducto(idProducto, idComboVal);
    }
  }

  eliminarProducto(idProductoTamano: number, idCombo: number) {
    // 🔹 CORRECCIÓN: Asegurar que los IDs sean números válidos
    const idProducto = idProductoTamano || 0;
    const idComboVal = idCombo || 0;
    
    this.detalles = this.detalles.filter(d => 
      !((idProducto > 0 && d.ID_Producto_T === idProducto) ||
        (idComboVal > 0 && d.ID_Combo === idComboVal))
    );
    this.detallesSubject.next([...this.detalles]);
  }

  // 🧹 Limpiar carrito
  limpiar() {
    this.detalles = [];
    this.detallesSubject.next([...this.detalles]);
  }

  // 🔹 Total general
  obtenerTotal(): number {
    return this.detalles.reduce((acc, d) => acc + (d.PrecioTotal || 0), 0);
  }

  // 🔹 Obtener detalles
  obtenerDetalles(): PedidoDetalle[] {
    return [...this.detalles];
  }
}