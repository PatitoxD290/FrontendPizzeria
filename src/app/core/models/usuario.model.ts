// ===========================================
// USUARIO
// ===========================================
export interface Usuario {
  id_usuario: number;
  perfil?: string;
  correo?: string;
  password?: string;
  roll: 'A' | 'E';
  estado: 'A' | 'I';
  fecha_registro: string;
}