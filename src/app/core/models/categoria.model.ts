// src/app/dashboard/models/categoria.model.ts
export interface Categoria {
  categoria_id?: number;          // opcional porque lo genera el backend
  nombre_categoria: string;
  descripcion_categoria?: string; // opcional
}
