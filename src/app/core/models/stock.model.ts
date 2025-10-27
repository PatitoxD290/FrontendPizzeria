// ===========================================
// STOCK
// ===========================================
export interface Stock {
  id_stock: number;
  id_insumo: number;
  id_proveedor: number;
  cantidad_recibida: number;
  costo_unitario: number;
  costo_total: number;
  fecha_entrada: string;
  fecha_vencimiento: string;
  estado: 'A' | 'I' | 'C';
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