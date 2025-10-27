// ===========================================
// RECETA
// ===========================================
export interface Receta {
  id_receta: number;
  nombre: string;
  descripcion: string;
  tiempo_preparacion: string;
}

// ===========================================
// RECETA DETALLE
// ===========================================
export interface RecetaDetalle {
  id_receta_d: number;
  id_receta: number;
  id_insumo: number;
  cantidad: number;
  uso: string;

  nombre_ingrediente?: string;
}