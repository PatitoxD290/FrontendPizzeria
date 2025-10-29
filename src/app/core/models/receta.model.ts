// ===========================================
// RECETA
// ===========================================
export interface Receta {
  ID_Receta: number;
  Nombre: string;
  Descripcion: string;
  Tiempo_Preparacion: string;
}

// ===========================================
// RECETA DETALLE
// ===========================================
export interface RecetaDetalle {
  ID_Receta_D: number;
  ID_Receta: number;
  ID_Insumo: number;
  Cantidad: number;
  Uso: string;

  nombre_ingrediente?: string;
}