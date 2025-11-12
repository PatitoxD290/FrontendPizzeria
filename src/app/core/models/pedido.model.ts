// ===========================================
// PEDIDO
// ===========================================
export interface Pedido {
  ID_Pedido: number;
  ID_Cliente: number;
  ID_Usuario: number | null; // Puede ser null según la BD
  Notas: string;
  SubTotal: number;
  Estado_P: 'P' | 'C' | 'E'; 
  Fecha_Registro: string;
  Hora_Pedido: string;

  // Opcional: cuando traigas el total calculado desde el backend
  PrecioTotal?: number;
}

export interface PedidoConDetalle extends Pedido {
  detalles?: PedidoDetalle[];
}


// ===========================================
// PEDIDO DETALLE
// ===========================================
export interface PedidoDetalle {
  ID_Pedido_D: number;
  ID_Pedido: number;

  // ✅ Campo correcto según modelo del backend
  ID_Producto_T: number;

  Cantidad: number;
  PrecioTotal: number;

  // Campos adicionales (opcionales) usados solo para mostrar en frontend
  nombre_producto?: string;
  nombre_categoria?: string;
  nombre_tamano?: string;
}

