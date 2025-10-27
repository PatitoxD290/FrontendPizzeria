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
}