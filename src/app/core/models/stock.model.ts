// ===========================================
// STOCK
// ===========================================
export interface Stock {
  id_stock: number;
  id_insumo: number;
  id_proveedor: number;
  Cantidad_recibida: number;
  Costo_unitario: number;
  Costo_total: number;
  Fecha_entrada: string;
  Fecha_vencimiento: string;
  Estado: 'A' | 'I' | 'C';
}

// ===========================================
// STOCK MOVIMIENTO
// ===========================================
export interface StockMovimiento {
  id_stock_m: number;
  id_stock: number;
  tipo_mov: 'Entrada' | 'Salida' | 'Ajuste';
  motivo: string;
  cantidad: number;
  stock_act: number;
  usuario_id: number;
  fecha_mov: string;
}