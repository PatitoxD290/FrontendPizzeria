// ===========================================
// STOCK (Para LEER/LISTAR en tablas)
// ===========================================
export interface Stock {
  ID_Stock: number;
  ID_Insumo: number;
  ID_Proveedor: number | null; 
  
  // 🟢 CAMPOS VISUALES (Vienen del Backend)
  Nombre_Insumo?: string;       // Ej: "Harina"
  Unidad_Med?: string;          // Ej: "KG"
  Stock_Max_Insumo?: number;    // Para referencia
  
  // 📊 DATOS CALCULADOS (Para barras de progreso)
  Porcentaje_Llenado?: string;  // Ej: "15.50%"
  Valor_Porcentaje?: number;    // Ej: 15.5 (para lógica de colores en front)
  Estado_Llenado?: string;      // Ej: "Bajo 🟠"

  Cantidad_Recibida: number;
  Costo_Unitario: number;
  Costo_Total: number;
  
  Fecha_Entrada: string;
  Fecha_Vencimiento: string | null;
  Estado: 'A' | 'I' | 'C'; // A=Activo, I=Inactivo, C=Caducado
}

// ===========================================
// STOCK DTO (Para CREAR nuevo stock)
// ===========================================
export interface StockDTO {
  ID_Insumo: number;
  ID_Proveedor?: number | null;
  Cantidad_Recibida: number;
  Costo_Unitario: number;
  // Costo_Total lo calcula el backend
  Fecha_Entrada?: string; // Opcional, backend pone fecha actual
  Fecha_Vencimiento?: string | null;
  Estado?: 'A' | 'I';
}

// ===========================================
// STOCK MOVIMIENTO (Para LEER historial)
// ===========================================
export interface StockMovimiento {
  ID_Stock_M: number;
  ID_Stock: number;
  Tipo_Mov: 'Entrada' | 'Salida' | 'Ajuste';
  Motivo: string | null;
  Cantidad: number;
  Stock_ACT: number;      // Stock resultante después del movimiento
  Usuario_ID: number | null;
  Fecha_Mov: string;
}

// ===========================================
// STOCK MOVIMIENTO DTO (Para REGISTRAR movimiento)
// ===========================================
export interface StockMovimientoDTO {
  ID_Stock: number;
  Tipo_Mov: 'Entrada' | 'Salida' | 'Ajuste';
  Motivo?: string;
  Cantidad: number;
  // Usuario_ID lo toma el backend del token
}

// ===========================================
// ALERTA DE VENCIMIENTO (Para la campanita 🔔)
// ===========================================
export interface AlertaVencimiento {
  id: number;       // ID del Stock
  mensaje: string;  // Ej: "El insumo Harina vence en 3 días"
  tipo: 'warning' | 'error';
  dias: number;
}