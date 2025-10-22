export interface DetalleReceta {
  detalle_receta_id?: number;   // opcional, lo genera el backend (IDENTITY)
  receta_id?: number;           // id de la receta a la que pertenece el detalle
  ingrediente_id: number;       // id del ingrediente usado
  cantidad_requerida: number;   // cantidad necesaria del ingrediente
  unidad_medida: string;        // unidad de medida (ej. gramos, ml, unidades)
  descripcion_uso?: string;     // descripción opcional del uso (ej. "picado", "en rodajas")
  
  // 👇 campo adicional útil para mostrar el nombre del ingrediente al listar
  nombre_ingrediente?: string;  // se obtiene con JOIN desde el backend
}
