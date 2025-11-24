// ===========================================
// PROVEEDOR (Para LEER en tablas)
// ===========================================
export interface Proveedor {
  ID_Proveedor: number;
  Nombre: string;
  Ruc: string;
  Direccion: string;
  Telefono: string;
  Email: string;
  Persona_Contacto: string;
  Estado: 'A' | 'I';
  Fecha_Registro: string; // ⚠️ Corregido: Backend envía Fecha_Registro (con R mayúscula)
}

// ===========================================
// PROVEEDOR DTO (Para CREAR o EDITAR)
// ===========================================
export interface ProveedorDTO {
  Nombre: string;
  Ruc: string;
  Direccion?: string;      // Opcional
  Telefono?: string;       // Opcional
  Email?: string;          // Opcional
  Persona_Contacto?: string; // Opcional
  Estado?: 'A' | 'I';      // Opcional al crear (default A)
}