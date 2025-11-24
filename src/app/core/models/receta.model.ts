// ===========================================
// RECETA (Para LEER en listas/detalles)
// ===========================================
export interface Receta {
  ID_Receta: number;
  Nombre: string;
  Descripcion: string;
  Tiempo_Preparacion: string; // Backend devuelve "00:45:00"
  
  // Opcional: Si cargas la receta completa con sus ingredientes
  detalles?: RecetaDetalle[];
}

// ===========================================
// RECETA DETALLE (Para LEER los ingredientes)
// ===========================================
export interface RecetaDetalle {
  ID_Receta_D: number;
  ID_Receta: number;
  ID_Insumo: number;
  
  // Datos propios del detalle
  Cantidad: number;
  Uso: string;

  // 🟢 Datos visuales (Vienen del Backend por el JOIN con Insumos)
  Nombre_Insumo?: string; 
  Unidad_Med?: string;    
}

// ===========================================
// RECETA DTO (Para CREAR una nueva receta)
// 🟢 USAR ESTE PARA EL POST
// ===========================================
export interface RecetaCreacionDTO {
  Nombre: string;
  Descripcion: string;
  
  // ⚠️ IMPORTANTE: Al crear, envías minutos (ej: 45), no string
  Tiempo_Preparacion: number; 
  
  // Array de ingredientes para guardar todo junto
  Detalles: RecetaDetalleDTO[];
}

// Sub-objeto para el DTO de creación
export interface RecetaDetalleDTO {
  ID_Insumo: number;
  Cantidad: number;
  Uso: string;
}