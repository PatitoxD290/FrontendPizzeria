// ===========================================
// COMBOS
// ===========================================
export interface Combo {
  id_combo: number;
  nombre: string;
  descripcion: string;
  precio: number;
  estado: 'A' | 'I';
}

// ===========================================
// COMBOS DETALLE
// ===========================================
export interface ComboDetalle {
  id_combo_d: number;
  id_combo: number;
  id_producto: number;
  id_tamano: number;
  cantidad: number;

  Producto_Nombre: string;
  Tamano_Nombre: string; 
}