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
  Estado_P: 'P' | 'C' | 'E' | 'D'; // P=Pendiente, C=Cancelado, E=Entregado, D=En Proceso
  
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
<<<<<<< HEAD
  PrecioTotal: number; 
=======
  PrecioTotal: number;

  // Campos adicionales (opcionales) usados solo para mostrar en frontend
  nombre_producto?: string;
  nombre_categoria?: string;
  nombre_tamano?: string;
  nombre_combo?: string; 
  detallesCombo?: any[]; 

>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c

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
  ID_Usuario: number | null; // Permitimos null para Kiosko
  Notas?: string;
  SubTotal: number;
  
  // 🔹 CORREGIDO: Agregado Estado_P
  Estado_P?: 'P' | 'C' | 'E' | 'D'; 

  // 🔹 CORREGIDO: Cambiado de Detalles a detalles (minúscula)
  detalles: PedidoDetalleDTO[];
}

export interface PedidoDetalleDTO {
  ID_Producto_T?: number | null;
  ID_Combo?: number | null;
  Cantidad: number;
  PrecioTotal: number; 
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