import { Injectable } from '@angular/core';

// 🟢 Interfaz local para manejar los datos en memoria
export interface ComplementoUI {
  ID_Producto_T: number;
  Nombre: string;      // Nombre del producto para mostrar en el chip/lista
  Precio: number;      // Precio si aplica
  Cantidad: number;    // Por defecto 1
}

@Injectable({
  providedIn: 'root'
})
export class ComplementoService {
  // Usamos la interfaz en lugar de any[]
  private complementosTemporales: ComplementoUI[] = [];

  /**
   * Agrega un complemento a la lista temporal.
   * Si ya existe, no lo duplica (comportamiento tipo Checklist).
   */
  agregarComplementoTemporal(complemento: ComplementoUI) {
    const existe = this.complementosTemporales.find(
      c => c.ID_Producto_T === complemento.ID_Producto_T
    );
    
    if (!existe) {
      this.complementosTemporales.push(complemento);
    } else {
      // Opcional: Si quisieras aumentar cantidad en vez de ignorar:
      // existe.Cantidad++;
    }
  }

  eliminarComplementoTemporal(idProductoT: number) {
    this.complementosTemporales = this.complementosTemporales.filter(
      c => c.ID_Producto_T !== idProductoT
    );
  }

  obtenerComplementosTemporales(): ComplementoUI[] {
    return this.complementosTemporales;
  }

  // Devuelve los datos formateados listos para el DTO de crear combo
  obtenerDetallesParaDTO() {
    return this.complementosTemporales.map(c => ({
      ID_Producto_T: c.ID_Producto_T,
      Cantidad: c.Cantidad
    }));
  }

  limpiarComplementosTemporales() {
    this.complementosTemporales = [];
  }

  tieneComplementos(): boolean {
    return this.complementosTemporales.length > 0;
  }

  estaSeleccionado(idProductoT: number): boolean {
    return this.complementosTemporales.some(c => c.ID_Producto_T === idProductoT);
  }

  obtenerCantidadComplementos(): number {
    return this.complementosTemporales.length;
  }
}