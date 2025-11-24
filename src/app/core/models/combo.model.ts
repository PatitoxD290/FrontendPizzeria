// ===========================================
// COMBO (Para LEER/LISTAR en el catálogo)
// ===========================================
export interface Combo {
  ID_Combo: number;
  Nombre: string;
  Descripcion: string;
  Precio: number;
  Estado: 'A' | 'I';
  
  // 🟢 Relaciones (El backend las incluye en el GET)
  detalles?: ComboDetalle[];
  imagenes?: string[]; // URLs de las imágenes
}

// ===========================================
// COMBOS DETALLE (Para LEER los ítems del combo)
// ===========================================
export interface ComboDetalle {
  ID_Combo_D: number;
  ID_Combo: number;
  ID_Producto_T: number;
  Cantidad: number;

  // 🟢 Campos visuales (Vienen del JOIN en backend)
  Producto_Nombre?: string;
  Tamano_Nombre?: string;
}

// ===========================================
// COMBO DTO (Para CREAR o EDITAR)
// 🟢 USAR ESTE PARA EL POST/PUT
// ===========================================
export interface ComboCreacionDTO {
  Nombre: string;
  Descripcion: string;
  Precio: number;
  Estado: 'A' | 'I';
  
  // Array simple para guardar la configuración
  detalles: ComboDetalleDTO[];
}

// Sub-objeto para el DTO de creación
export interface ComboDetalleDTO {
  ID_Producto_T: number;
  Cantidad: number;
}