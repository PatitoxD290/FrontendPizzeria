// =========================================
// PRODUCTO (Para LEER/LISTAR en el catálogo)
// =========================================
export interface Producto {
  ID_Producto: number;
  Nombre: string;
  Descripcion: string;
  ID_Categoria_P: number;
  ID_Receta?: number | null;
  Cantidad_Disponible: number;
  Estado: 'A' | 'I' | 'G'; // A=Activo, I=Inactivo, G=Agotado
  Fecha_Registro: string;
  
  // Campos visuales (opcionales, si el backend hace JOIN)
  nombre_categoria?: string;
  nombre_receta?: string;
  
  // Relación: lista de tamaños disponibles con sus precios
  tamanos?: ProductoTamano[];
  
  // Imágenes (URLs devueltas por el backend)
  imagenes?: string[];
}

// =========================================
// PRODUCTO_TAMANO (Para LEER los precios por tamaño)
// =========================================
export interface ProductoTamano {
  ID_Producto_T: number;
  ID_Producto: number;
  ID_Tamano: number;
  Precio: number;
  Estado: 'A' | 'I';
  Fecha_Registro: string;
  
  // Nombre del tamaño para mostrar (Ej: "Familiar")
  nombre_tamano?: string; 
}

// =========================================
// PRODUCTO DTO (Para CREAR o EDITAR)
// 🟢 USAR ESTE PARA EL POST/PUT
// =========================================
export interface ProductoCreacionDTO {
  Nombre: string;
  Descripcion: string;
  ID_Categoria_P: number;
  ID_Receta?: number | null;
  Cantidad_Disponible: number;
  Estado: 'A' | 'I' | 'G';
  
  // Al crear, enviamos un array simple de configuración de tamaños
  Producto_Tamano: ProductoTamanoDTO[];
}

// Sub-DTO para asignar tamaños al crear el producto
export interface ProductoTamanoDTO {
  ID_Tamano: number; // El ID del tamaño (ej: 1 para Personal)
  Precio: number;    // El precio para ese tamaño
}