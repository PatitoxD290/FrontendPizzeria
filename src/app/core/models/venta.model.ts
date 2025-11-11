// ===========================================
// VENTA (para leer datos)
// ===========================================
export interface Venta {
  ID_Venta: number;
  ID_Pedido: number;
  Tipo_Venta: 'B' | 'F' | 'N'; // Boleta | Factura | Nota
  Metodo_Pago: 'E' | 'T' | 'B'; // Efectivo | Tarjeta | Billetera
  Lugar_Emision: 'A' | 'B'; // A: Tupac | B: Yarina
  IGV: number;
  Total: number;
  Monto_Recibido: number; // 🔹 NUEVO
  Vuelto: number; // 🔹 NUEVO
  
  Cliente_Nombre: string;
  Productos: VentaProducto[];
  Fecha_Registro: string; 
}

// ===========================================
// PRODUCTO EN VENTA (para leer datos)
// ===========================================
export interface VentaProducto {
  id_producto: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// ===========================================
// VENTA CREACION DTO (para escribir datos)
// 🟢 ESTE ES EL TIPO QUE USAMOS PARA CREAR VENTAS
// ===========================================
export type VentaCreacionDTO = {
  ID_Pedido: number;
  Tipo_Venta: 'B' | 'F' | 'N';
  Metodo_Pago: 'E' | 'T' | 'B';
  Lugar_Emision: 'A' | 'B';
  IGV_Porcentaje: number; // El backend espera el porcentaje
  Monto_Recibido?: number; // 🔹 NUEVO: Opcional para mantener compatibilidad
};