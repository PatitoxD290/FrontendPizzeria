// ===========================================
// CUPONES
// ===========================================
export interface Cupon {
  ID_Cupon: number;
  Cod_Cupon: string;
  Descripcion: string;
  Tipo_Desc: 'Porcentaje' | 'Monto';
  Valor_Desc: number;
  Monto_Max: number;
  Usos_Max: number;
  Usos_Act: number;
  Fecha_INC: string;
  Fecha_FIN: string;
  Estado: 'A' | 'I';
  Fecha_Registro: string;
}

// ===========================================
// USO CUPON
// ===========================================
export interface UsoCupon {
  ID_Uso_C: number;
  ID_Cupon: number;
  ID_Pedido: number;
  Descuento_Aplic: number;
  Monto_Venta: number;
  Fecha_Uso: string;
}