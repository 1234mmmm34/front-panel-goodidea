export interface Usuario {
  id: number;
  username: string | null;
  password: string;               // siempre "" desde el front
  v_email: string | null;
  b_mailConfirmed: boolean;
  b_Active: boolean;
  d_FechaCreacion: string;        // ISO
  d_UltimoLogin: string | null;
  v_telefono: string | null;
  i_CvePerfil: number | null;
  i_CveTenant: number | null;
  v_Nombres: string | null;
  v_ApellidoPaterno: string | null;
  v_ApellidoMaterno: string | null;
}

export interface UsuariosPagedDto {
  data: Usuario[];
  i_TotalRegistros: number;
}

export interface Perfil {
  i_CvePerfil: number;
  i_CveTenant: number;
  v_NombrePerfil: string;
  v_Descripcion: string;
}

export interface Tenant {
  i_CveTenant: number;
  v_Nombre: string;
}

export interface FiltrosUsuariosState {
  i_CveTenant: number;
  i_Activo: number;
  i_Confirmado: number;
  searchTerm: string;
}
