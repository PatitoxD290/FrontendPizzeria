// ===========================================
// CATEGORÍA PRODUCTO (Para LEER/LISTAR)
// ===========================================
export interface CategoriaProducto {
  ID_Categoria_P: number;
  Nombre: string;
}

// ===========================================
// CATEGORÍA PRODUCTO DTO (Para CREAR o EDITAR)
// 🟢 USAR ESTE PARA EL POST/PUT
// ===========================================
export interface CategoriaProductoDTO {
  Nombre: string;
}

// ===========================================
// CATEGORÍA INSUMOS (Para LEER/LISTAR)
// ===========================================
export interface CategoriaInsumos {
  ID_Categoria_I: number;
  Nombre: string;
}

// ===========================================
// CATEGORÍA INSUMOS DTO (Para CREAR o EDITAR)
// 🟢 USAR ESTE PARA EL POST/PUT
// ===========================================
export interface CategoriaInsumoDTO {
  Nombre: string;
}