// ===========================================
// PROVEEDOR
// ===========================================
export interface Proveedor {
  ID_Proveedor: number;
  Nombre: string;
  Ruc: string;
  Direccion: string;
  Telefono: string;
  Email: string;
  Persona_contacto: string;
  Estado: 'A' | 'I';
  Fecha_registro: string;
}