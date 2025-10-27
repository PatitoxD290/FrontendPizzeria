// ===========================================
// CUPONES
// ===========================================
export interface Cupon {
  id_cupon: number;
  cod_cupon: string;
  descripcion: string;
  tipo_desc: 'Porcentaje' | 'Monto';
  valor_desc: number;
  monto_max: number;
  usos_max: number;
  usos_act: number;
  fecha_inc: string;
  fecha_fin: string;
  estado: 'A' | 'I';
  fecha_registro: string;
}

// ===========================================
// USO CUPON
// ===========================================
export interface UsoCupon {
  id_uso_c: number;
  id_cupon: number;
  id_pedido: number;
  descuento_aplic: number;
  monto_venta: number;
  fecha_uso: string;
}