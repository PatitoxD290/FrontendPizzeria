export interface Ingrediente {
  ingrediente_id?: number;
  nombre_ingrediente: string;
  descripcion_ingrediente?: string;
  unidad_medida: string;
  categoria_ingrediente: string;
  stock_minimo: number;
  stock_maximo: number;
  estado: string;              // "A" o "I"
  fecha_registro?: string;     // Fecha en formato ISO o string
}
