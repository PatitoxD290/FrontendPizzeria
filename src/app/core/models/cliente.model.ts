// ===========================================
// CLIENTE (Para LEER en tablas/listas)
// ===========================================
export interface Cliente {
  ID_Cliente: number;
  
  // 🟢 Nuevos campos normalizados
  ID_Tipo_Doc: number | null; 
  Numero_Documento: string;   // Reemplaza a 'DNI'
  
  Nombre: string;
  Apellido: string;
  Telefono: string;
  Fecha_Registro: string;
}

// ===========================================
// CLIENTE DTO (Para CREAR o EDITAR)
// 🟢 USAR ESTE PARA EL POST/PUT
// ===========================================
export interface ClienteDTO {
  ID_Tipo_Doc?: number | null; // Opcional si el backend lo deduce
  Numero_Documento: string;
  Nombre: string;
  Apellido: string;
  Telefono?: string;
}

// ===========================================
// RESPUESTA PUNTOS (Para la consulta de fidelidad)
// ===========================================
export interface ClientePuntos {
  ID_Cliente: number;
  Nombre_Completo: string;
  Puntos: number;
}