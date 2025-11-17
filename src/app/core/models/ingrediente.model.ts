// ===========================================
// INSUMOS - Ingredientes
// ===========================================
export interface Insumo {
  ID_Insumo: number;
  Nombre: string;
  Descripcion: string;
  Unidad_Med: string;
  ID_Categoria_I: number;
  Stock_Min: number;
  Stock_Max: number;
  Estado: 'D' | 'A';
  Fecha_Registro: string;
  // Campos adicionales para crear stock al registrar insumo
  ID_Proveedor?: number | null;
  Costo_Unitario?: number;
  Fecha_Vencimiento?: string | null;
}