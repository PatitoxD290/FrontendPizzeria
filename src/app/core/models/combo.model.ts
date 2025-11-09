// ===========================================
// COMBOS
// ===========================================
export interface Combo {
  ID_Combo: number;
  Nombre: string;
  Descripcion: string;
  Precio: number;
  Estado: 'A' | 'I';
}

// ===========================================
// COMBOS DETALLE
// ===========================================
export interface ComboDetalle {
  ID_Combo_D: number;
  ID_Combo: number;

  // ✅ Campo correcto según backend
  ID_Producto_T: number;

  Cantidad: number;

  // ✅ Campos solo para mostrar en pantallas (opcionales)
  Producto_Nombre?: string;
  Tamano_Nombre?: string;
}
