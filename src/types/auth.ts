export interface LoginResponse {
  id_usuario: number | null;
  username: string;
  v_email: string;
  v_Nombre: string;    // Nombre del tenant
  password: string;    // JWT token de sesión (deuda técnica de naming en el backend)
  i_CvePerfil: number;
  i_CveTenant: number;
}

export interface SesionAlmacenada {
  id_usuario: number;
  username: string;
  email: string;
  tenant: string;
  token: string;       // JWT token mapeado desde password
  id_perfil: number;
  id_tenant: number;
}

export interface LoginPayload {
  v_email: string;
  password: string;
}
