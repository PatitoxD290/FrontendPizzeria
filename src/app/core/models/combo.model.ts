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
  ID_Producto: number;
  ID_Tamano: number;
  Cantidad: number;

  Producto_Nombre: string;
  Tamano_Nombre: string; 
}