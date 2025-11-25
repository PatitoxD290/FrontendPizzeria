// ===========================================
// PEDIDO (Para LEER el historial/listado)
// ===========================================
export interface Pedido {
  ID_Pedido: number;
  ID_Cliente: number;
  ID_Usuario: number | null; // Campos visuales (Vienen del Backend por JOINs)
  Cliente_Nombre?: string;
  Usuario_Nombre?: string;

  Notas: string;
  SubTotal: number; // 🟢 Único campo monetario en la tabla Pedido
  Estado_P: 'P' | 'E' | 'C';
  Fecha_Registro: string;
  Hora_Pedido: string; // ❌ PrecioTotal eliminado
}

// ===========================================
// PEDIDO CON DETALLE (Para LEER una orden completa)
// ===========================================
export interface PedidoConDetalle extends Pedido {
  detalles: PedidoDetalle[];
}

// ===========================================
// PEDIDO DETALLE (Para LEER los ítems de un pedido)
// ===========================================
export interface PedidoDetalle {
  ID_Pedido_D: number;
  ID_Pedido: number; // Puede ser Producto O Combo (uno será null/undefined)
  ID_Producto_T?: number | null;
  ID_Combo?: number | null;
  Cantidad: number;
  PrecioTotal: number; // 🟢 Correcto: Este campo SÍ existe en Pedido_Detalle // 🟢 Campos Visuales (Vienen del Backend)

  Nombre_Producto?: string;
  Nombre_Combo?: string;
  Nombre_Item?: string;
  Tamano_Nombre?: string;
  Descripcion?: string;
  Tipo: 'producto' | 'combo';
}

// ===========================================
// DTOs DE CREACIÓN (Para ENVIAR al Backend)
// ===========================================
export interface PedidoCreacionDTO {
  ID_Cliente: number;
  ID_Usuario: number | null;
  Notas?: string; // Aunque el backend lo recalcula, lo mantenemos por consistencia del DTO, pero el backend lo sobrescribe.
  SubTotal: number;
  Estado_P?: 'P' | 'E' | 'C';
  detalles: PedidoDetalleDTO[];
}

export interface PedidoDetalleDTO {
  ID_Producto_T?: number | null;
  ID_Combo?: number | null;
  Cantidad: number;
  PrecioTotal: number; // 🟢 El backend lo recalcula, pero es útil como placeholder DTO.
  Complementos?: any[];
}

// ===========================================
// DATOS PEDIDO (Modelo UI / Carrito de Compras)
// ===========================================
export interface DatosPedido {
  id: number;

  // IDs reales para enviar al backend
  idProductoT?: number | null;
  idCombo?: number | null;

  nombre: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;

  tamano?: string;
  esCombo: boolean;
  descripcion?: string;
}
