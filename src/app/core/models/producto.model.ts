// src/app/dashboard/models/producto.model.ts
export interface Producto {
  producto_id?: number;          // ID autogenerado
  nombre_producto: string;       // Nombre del producto
  descripcion_producto: string;  // Descripción breve
  categoria_id: number;          // Relación con la categoría
  receta_id?: number | null;     // Relación con la receta (puede ser null)
  precio_venta: number;          // Precio del producto
  estado?: string;               // 'A' (Activo) o 'I' (Inactivo)
  fecha_registro?: string;       // Fecha de creación (desde backend)
}
