// src/app/dashboard/models/receta.model.ts
export interface Receta {
  receta_id?: number;              // opcional, lo genera el backend
  nombre_receta: string;           // nombre de la receta
  descripcion_receta: string;      // descripción o pasos
  tiempo_estimado_minutos?: number; // opcional, tiempo estimado en minutos
}
