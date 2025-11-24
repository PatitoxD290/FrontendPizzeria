// ===========================================
// INSUMO (Para LEER/LISTAR en tablas)
// ===========================================
export interface Insumo {
  ID_Insumo: number;
  Nombre: string;
  Descripcion: string;
  Unidad_Med: string;
  ID_Categoria_I: number;
  
  Stock_Min: number;
  Stock_Max: number;
  
  Estado: 'D' | 'A'; // D=Disponible, A=Agotado
  Fecha_Registro: string;

  // Campos visuales (Opcionales, si el backend hace JOIN)
  Nombre_Categoria?: string;
}

// ===========================================
// INSUMO DTO (Para CREAR un nuevo insumo)
// 🟢 USAR ESTE PARA EL POST
// ===========================================
export interface InsumoCreacionDTO {
  Nombre: string;
  Descripcion: string;
  Unidad_Med: string;
  ID_Categoria_I: number;
  Stock_Min: number;
  
  // Campos Opcionales para Stock Inicial (Backend lo maneja)
  ID_Proveedor?: number | null;
  Costo_Unitario?: number;
  Fecha_Vencimiento?: string | null;
}

// ===========================================
// INSUMO UPDATE DTO (Para EDITAR)
// 🟠 USAR ESTE PARA EL PUT
// ===========================================
export interface InsumoUpdateDTO {
  Nombre: string;
  Descripcion: string;
  Unidad_Med: string;
  ID_Categoria_I: number;
  Stock_Min: number;
  Stock_Max: number;

  // Tu backend permite actualizar stock/proveedor desde aquí también
  ID_Proveedor?: number | null;
  Costo_Unitario?: number;
  Fecha_Vencimiento?: string | null;
}

// ===========================================
// CATEGORÍA INSUMO (Para los Selects/Spinners)
// ===========================================
export interface CategoriaInsumo {
  ID_Categoria_I: number;
  Nombre: string;
}