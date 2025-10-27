// ===========================================
// INSUMOS - Ingredientes
// ===========================================
export interface Insumo {
  id_insumo: number;
  nombre: string;
  descripcion: string;
  unidad_med: string;
  id_categoria_i: number;
  stock_min: number;
  stock_max: number;
  estado: 'D' | 'A';
  fecha_registro: string;
}