// ===========================================
// USUARIO
// ===========================================
export interface Usuario {
  ID_Usuario: number;
  Perfil: string;         // Nombre completo del usuario
  Correo: string;         // Correo o DNI (según tu backend)
  Password: string;
  Roll: 'A' | 'E';        // A = Admin, E = Empleado
  Estado: 'A' | 'I';      // A = Activo, I = Inactivo
  Fecha_Registro: string; // Fecha en formato string
}
