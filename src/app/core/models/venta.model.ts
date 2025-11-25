// ===========================================
// VENTA (Para LEER datos desde el Backend)
// ===========================================
export interface Venta {
  ID_Venta: number;
  ID_Pedido: number;
  
  // 🟢 IDs numéricos (relaciones BD)
  ID_Tipo_Venta: number; 
  ID_Tipo_Pago: number; 
  ID_Origen_Venta: number; 

  // 🔵 Nombres descriptivos (Vienen del JOIN en el backend)
  Tipo_Venta_Nombre?: string; 
  Metodo_Pago_Nombre?: string;
  Origen_Venta_Nombre?: string; 
  Cliente_Nombre?: string;

  IGV: number;
  Total: number;
  Monto_Recibido: number;
  Vuelto: number;
  
  Fecha_Registro: string; 
  
  // Opcional: si el backend te devuelve los detalles anidados
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
  Item_Nombre: string;  // Nombre del Producto o Combo
  Tamano_Nombre: string; // Ej: "Familiar" o "Combo"
  Tipo: 'producto' | 'combo';
  
  Cantidad: number;
  PrecioTotal: number;  // Precio total de la línea
}

// ===========================================
// VENTA CREACION DTO (Para ESCRIBIR/ENVIAR al Backend)
// ===========================================
export type VentaCreacionDTO = {
  ID_Pedido: number;
  
  // Enviar el ID seleccionado
  ID_Tipo_Venta: number; 
  ID_Tipo_Pago: number; 
  ID_Origen_Venta: number; 
  
  Monto_Recibido: number;
};