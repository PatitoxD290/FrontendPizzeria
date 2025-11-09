import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ComplementoService {
  private complementosTemporales: any[] = [];

  agregarComplementoTemporal(complemento: any) {
    // ✅ Verificar si ya existe el complemento (mismo ID_Producto_T)
    const existe = this.complementosTemporales.find(
      c => c.ID_Producto_T === complemento.ID_Producto_T
    );
    
    if (!existe) {
      this.complementosTemporales.push(complemento);
    }
  }

  eliminarComplementoTemporal(idProductoT: number) {
    this.complementosTemporales = this.complementosTemporales.filter(
      c => c.ID_Producto_T !== idProductoT
    );
  }

  obtenerComplementosTemporales() {
    return this.complementosTemporales;
  }

  limpiarComplementosTemporales() {
    this.complementosTemporales = [];
  }

  tieneComplementos(): boolean {
    return this.complementosTemporales.length > 0;
  }

  // ✅ Nuevo método para verificar si un complemento está seleccionado
  estaSeleccionado(idProductoT: number): boolean {
    return this.complementosTemporales.some(c => c.ID_Producto_T === idProductoT);
  }

  // ✅ Nuevo método para obtener la cantidad de complementos seleccionados
  obtenerCantidadComplementos(): number {
    return this.complementosTemporales.length;
  }
}