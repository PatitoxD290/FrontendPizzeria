// ===========================================
// USUARIO (Para LEER/LISTAR datos)
// ===========================================
export interface Usuario {
  ID_Usuario: number;
  Perfil: string;         // Nombre del perfil o usuario
  Correo: string;         // Email de acceso
  
  // Nota: El backend NO devuelve el password real por seguridad
  Roll: 'A' | 'E';        // A=Admin, E=Empleado
  Estado: 'A' | 'I';      // A=Activo, I=Inactivo
  
  Fecha_Registro: string;
}

// ===========================================
// USUARIO DTO (Para CREAR o EDITAR)
// ===========================================
export interface UsuarioDTO {
  Perfil: string;
  Correo: string;
  
  // El password es obligatorio al crear, pero opcional al editar
  Password?: string; 
  
  Roll: 'A' | 'E';
  Estado: 'A' | 'I';
}