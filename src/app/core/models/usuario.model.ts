// ===========================================
// USUARIO
// ===========================================
export interface Usuario {
  id_usuario: number;
  Perfil: string;
  Correo: string;
  Password: string;
  Roll: 'A' | 'E';
  Estado: 'A' | 'I';
  Fecha_registro: string;
}