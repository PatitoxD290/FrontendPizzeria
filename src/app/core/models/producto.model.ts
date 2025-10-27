// ===========================================
// PRODUCTO
// ===========================================
export interface Producto {
  ID_Producto: number;
  Nombre: string;
  Descripcion: string;
  Precio_Base: number;
  ID_Categoria_P: number;
  ID_Receta: number;
  Estado: 'A' | 'I';
  Fecha_Registro: string;


  nombre_categoria?: string;
  nombre_receta?: string;
}