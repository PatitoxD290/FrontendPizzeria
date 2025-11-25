// ===========================================
// PEDIDO (Para LEER el historial/listado)
// ===========================================
export interface Pedido {
  ID_Pedido: number;
  ID_Cliente: number;
  ID_Usuario: number | null; 
  
  // Campos visuales (Vienen del Backend por JOINs)
  Cliente_Nombre?: string;
  Usuario_Nombre?: string;

  Notas: string;
  SubTotal: number;
  Estado_P: 'P' | 'E' | 'C'; // REMOVER 'D'
  
  Fecha_Registro: string;
  Hora_Pedido: string;
  
  // Opcional: Precio total calculado si viene del backend
  PrecioTotal?: number;
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
  ID_Pedido: number;
  
  // Puede ser Producto O Combo (uno será null/undefined)
  ID_Producto_T?: number | null;
  ID_Combo?: number | null;       
  
  Cantidad: number;
  PrecioTotal: number; 

  // 🟢 Campos Visuales (Vienen del Backend)
  Nombre_Producto?: string;
  Nombre_Combo?: string;
  
  Nombre_Item?: string;
  
  Tamano_Nombre?: string; 
  Descripcion?: string;   
  
  Tipo: 'producto' | 'combo';
}

// ===========================================
// DTOs DE CREACIÓN (Para ENVIAR al Backend)
// 🟢 USAR ESTE PARA EL POST /pedidos
// ===========================================
export interface PedidoCreacionDTO {
  ID_Cliente: number;
  ID_Usuario: number | null;
  Notas?: string;
  SubTotal: number;
  Estado_P?: 'P' | 'E' | 'C'; // AGREGAR
  detalles: PedidoDetalleDTO[];
}

export interface PedidoDetalleDTO {
  ID_Producto_T?: number | null;
  ID_Combo?: number | null;
  Cantidad: number;
  PrecioTotal: number;
  Complementos?: any[]; // AGREGAR si usas complementos
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