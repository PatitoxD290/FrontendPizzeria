// ===========================================
// STOCK
// ===========================================
export interface Stock {
  ID_Stock: number;
  ID_Insumo: number;
  ID_Proveedor: number | null; // Coincide con el backend (puede ser null)
  Cantidad_Recibida: number;
  Costo_Unitario: number;
  Costo_Total: number;
  Fecha_Entrada: string;
  Fecha_Vencimiento: string | null; // Puede ser null
  Estado: 'A' | 'I' | 'C'; // A=Activo, I=Inactivo, C=Caducado
}

// ===========================================
// STOCK MOVIMIENTO
// ===========================================
export interface StockMovimiento {
  ID_Stock_M: number;
  ID_Stock: number;
  Tipo_Mov: 'Entrada' | 'Salida' | 'Ajuste';
  Motivo: string | null; // Opcional
  Cantidad: number;
  Stock_ACT: number;
  Usuario_ID: number | null; // Ahora viene del backend automáticamente
  Fecha_Mov: string;
  Estado?: 'A' | 'I';
}
