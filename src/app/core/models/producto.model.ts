// ===========================================
// PRODUCTO
// ===========================================
export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio_base: number;
  id_categoria_p: number;
  id_receta: number;
  estado: 'A' | 'I';
  fecha_registro: string;


  nombre_categoria?: string;
  nombre_receta?: string;
}