export interface InstructorDto {
  i_CveInstructor: number;
  v_Nombre: string;
  v_Email: string | null;
}

export interface InstructorCreateUpdateDto {
  i_CveInstructor?: number;
  v_Nombre: string;
  v_Email: string | null;
}

export interface PersonalDomicilioDto {
  i_CveDomicilio: number;         // 0 si es nuevo
  v_NombreCalle: string | null;
  v_NumeroInterior: string | null;
  v_NumeroExterior: string | null;
  v_Fraccionamiento: string | null;
  i_CodigoPostal: number;
}

export interface PersonalListaDto {
  i_CveInstructor: number;
  v_Nombre: string | null;
  v_ApellidoPat: string | null;
  v_ApellidoMat: string | null;
  v_Email: string | null;
  v_TelPersonal: string | null;
  v_NombreCEmergencia: string | null;
  v_TelCEmergencia: string | null;
  v_Sangre: string | null;
  v_Alergias: string | null;
  v_KeyFoto: string | null;
  d_FechaActualizacion: string | null;
  b_Vencido: boolean;
}

export interface PersonalDetalleDto {
  i_CveInstructor: number;
  v_Nombre: string | null;
  v_ApellidoPat: string | null;
  v_ApellidoMat: string | null;
  v_Email: string | null;
  v_TelTrabajo: string | null;
  v_TelPersonal: string | null;
  v_NombreCEmergencia: string | null;
  v_TelCEmergencia: string | null;
  v_Sangre: string | null;
  v_Alergias: string | null;
  v_KeyFoto: string | null;
  d_FechaActualizacion: string | null;
  b_Vencido: boolean;
  domicilio: PersonalDomicilioDto | null;
  Domicilio?: PersonalDomicilioDto | null;
}

export interface PersonalGuardarDto {
  i_CveInstructor: number;
  v_Nombre: string;
  v_ApellidoPat: string | null;
  v_ApellidoMat: string | null;
  v_Email: string | null;
  v_TelTrabajo: string | null;
  v_TelPersonal: string | null;
  v_NombreCEmergencia: string | null;
  v_TelCEmergencia: string | null;
  v_Sangre: string | null;
  v_Alergias: string | null;
  Domicilio: PersonalDomicilioDto | null;   // null si no se capturó domicilio
}
