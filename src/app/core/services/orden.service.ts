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
    if (!detalle.Cantidad || detalle.Cantidad <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Cantidad inválida',
        text: 'No puedes agregar un ítem con cantidad 0.',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

<<<<<<< HEAD
    // Validar si es Combo o Producto
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
        return d.ID_Producto_T === idBusqueda && !d.ID_Combo; // Asegurar que no sea parte de un combo mixto
      }
    });
=======
    // 🔹 CAMBIO: Buscar por ID_Producto_T O ID_Combo
    const existente = this.detalles.find(d => 
      (detalle.ID_Producto_T && d.ID_Producto_T === detalle.ID_Producto_T) ||
      (detalle.ID_Combo && d.ID_Combo === detalle.ID_Combo)
    );
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c

    if (existente) {
      // Actualizar existente
      existente.Cantidad += detalle.Cantidad;
      // Recalcular precio total (PrecioUnitario * NuevaCantidad)
      // Nota: Para que esto funcione bien, idealmente deberías guardar el PrecioUnitario en el objeto.
      // Aquí asumimos que el precio unitario se puede deducir: (PrecioTotal / Cantidad Antigua)
      const precioUnitario = existente.PrecioTotal / (existente.Cantidad - detalle.Cantidad);
      existente.PrecioTotal = precioUnitario * existente.Cantidad;
    } else {
      // Agregar nuevo (Usamos spread para romper referencia)
      this.detalles.push({ ...detalle });
    }

    this.actualizarEstado();
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c

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