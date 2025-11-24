// ===========================================
// VENTA (Para LEER datos desde el Backend)
// ===========================================
export interface Venta {
  ID_Venta: number;
  ID_Pedido: number;
  
  // 🟢 Ahora son IDs numéricos (relaciones BD)
  ID_Tipo_Venta: number; 
  ID_Tipo_Pago: number;  
  ID_Origen_Venta: number; // Antes Lugar_Emision

  // 🔵 Nombres descriptivos (Vienen del JOIN en el backend para mostrar en tabla)
  Tipo_Venta_Nombre?: string;   // Ej: "Boleta"
  Metodo_Pago_Nombre?: string;  // Ej: "Efectivo"
  Origen_Venta_Nombre?: string; // Ej: "Mostrador"
  Cliente_Nombre?: string;

  IGV: number;
  Total: number;
  Monto_Recibido: number;
  Vuelto: number;
  
  Fecha_Registro: string; 
  
  // Opcional: si el backend te devuelve los detalles anidados en alguna vista
  Productos?: VentaProducto[];
}

// ===========================================
// PRODUCTO EN VENTA (Para LEER detalles de boleta/historial)
// ===========================================
export interface VentaProducto {
  // Identificadores
  ID_Pedido_D?: number;
  ID_Producto_T?: number;
  ID_Combo?: number;

  // Datos visuales
  Item_Nombre: string;   // Nombre del Producto o Combo
  Tamano_Nombre: string; // Ej: "Familiar" o "Combo"
  Tipo: 'producto' | 'combo';
  
  Cantidad: number;
  PrecioTotal: number;   // El backend devuelve el precio total de la línea
}

// ===========================================
// VENTA CREACION DTO (Para ESCRIBIR/ENVIAR al Backend)
// 🟢 USAR ESTE PARA EL POST /ventas
// ===========================================
export type VentaCreacionDTO = {
  ID_Pedido: number;
  
  // Enviar el ID seleccionado del <select>/spinner
  ID_Tipo_Venta: number;   // Ej: 1 (Boleta)
  ID_Tipo_Pago: number;    // Ej: 1 (Efectivo)
  ID_Origen_Venta: number; // Ej: 1 (Mostrador)
  
  Monto_Recibido: number;
};