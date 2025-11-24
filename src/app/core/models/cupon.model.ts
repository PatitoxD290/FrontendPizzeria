// ===========================================
// CUPÓN (Para LEER/LISTAR en tablas)
// ===========================================
export interface Cupon {
  ID_Cupon: number;
  Cod_Cupon: string;
  Descripcion: string;
  
  Tipo_Desc: 'Porcentaje' | 'Monto';
  Valor_Desc: number;
  Monto_Max: number;
  
  Usos_Max: number;
  Usos_Act: number; // Cuántas veces se ha usado ya
  
  Fecha_INC: string;
  Fecha_FIN: string | null; // ⚠️ Puede ser null si es indefinido
  
  Estado: 'A' | 'I';
  Fecha_Registro: string;
}

// ===========================================
// CUPÓN DTO (Para CREAR un nuevo cupón)
// 🟢 USAR ESTE PARA EL POST
// ===========================================
export interface CuponCreacionDTO {
  Cod_Cupon: string;
  Descripcion: string;
  Tipo_Desc: 'Porcentaje' | 'Monto';
  Valor_Desc: number;
  
  // Opcionales con valores por defecto en backend
  Monto_Max?: number; 
  Usos_Max?: number;
  
  Fecha_INC: string;
  Fecha_FIN?: string | null;
  
  Estado: 'A' | 'I';
}

// ===========================================
// USO CUPÓN (Para LEER historial de usos)
// ===========================================
export interface UsoCupon {
  ID_Uso_C: number;
  ID_Cupon: number;
  ID_Pedido: number;
  Descuento_Aplic: number;
  Monto_Venta: number;
  Fecha_Uso: string;
}

// ===========================================
// USO CUPÓN DTO (Para aplicar manualmente si fuera necesario)
// ===========================================
export interface UsoCuponDTO {
  ID_Cupon: number;
  ID_Pedido: number;
  Descuento_Aplic: number;
  Monto_Venta: number;
}