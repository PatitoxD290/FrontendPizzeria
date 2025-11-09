// src/app/core/models/producto.model.ts

// =========================================
// PRODUCTO
// =========================================
export interface Producto {
  ID_Producto: number;
  Nombre: string;
  Descripcion: string;
  ID_Categoria_P: number;
  ID_Receta?: number | null;
  Cantidad_Disponible: number;
  Estado: 'A' | 'I' | 'G';
  Fecha_Registro: string;
  
  // Campos adicionales calculados (opcional para mostrar)
  nombre_categoria?: string;
  nombre_receta?: string;
  
  // Nueva relación: lista de tamaños con precio
  tamanos?: ProductoTamano[];
}

// =========================================
// PRODUCTO_TAMANO
// =========================================
export interface ProductoTamano {
  ID_Producto_T: number;
  ID_Producto: number;
  ID_Tamano: number;
  Precio: number;
  Estado: 'A' | 'I';
  Fecha_Registro: string;
  
  // Para mostrar en la lista
  nombre_tamano?: string;
}