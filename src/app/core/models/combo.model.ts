// Modelo principal del combo
export interface Combo {
  ID_Combo?: number;           // ID autogenerado por el backend
  Nombre: string;              // Nombre del combo
  Descripcion?: string;        // Descripción opcional
  Precio: number;              // Precio base
  Estado?: 'A' | 'I';          // Activo / Inactivo
  detalles: ComboDetalle[];    // Lista de productos del combo
}

// Modelo de detalle dentro de un combo
export interface ComboDetalle {
  ID_Producto: number;         // Producto incluido en el combo
  ID_Tamano: number;           // Tamaño del producto (si aplica)
  Cantidad: number;            // Cantidad de ese producto en el combo

  // Campos opcionales para visualización en el frontend
  Producto_Nombre?: string;    // Nombre del producto
  Tamano_Nombre?: string;      // Nombre del tamaño
}
