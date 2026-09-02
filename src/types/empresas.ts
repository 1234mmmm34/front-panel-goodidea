export interface Domicilios {
  iD_Domicilio: number;
  i_TipoDomicilio: number;
  s_NombreCalle: string;
  s_NumeroInterior: string;
  s_NumeroExterior: string;
  s_Fraccionamiento: string;
  s_TipoAsentamiento: string;
  i_Estado: number;
  i_Municipio: number;
  i_CodigoPostal: number;
}

export interface Empresas {
  iD_Empresa: number;
  d_FechaAlta: string;
  d_FechaBaja: string | null;
  s_RazonSocial: string;
  s_RegistroPatronal: string;
  s_Domicilio: string;
  s_RepresentanteLegal: string;
  s_Status: string;
  s_GiroActividad: string;
  i_TipoContacto: number;
  s_RFC: string;
  i_DiasCredito: string;
}

export interface EmpresaGetDto {
  iD_Empresa: number;
  d_FechaBaja: string | null;
  d_FechaAlta: string | null;
  s_RazonSocial: string | null;
  s_RegistroPatronal: string | null;
  s_Domicilio: string | null;
  s_RepresentanteLegal: string | null;
  s_RFC: string | null;
  d_DiasCredito: number | null;
  s_GiroActividad: string | null;
  d_CveDomicilio: number | null;
  i_TipoDomicilio: number | null;
  v_NombreCalle: string | null;
  v_NumeroInterior: string | null;
  v_NumeroExterior: string | null;
  v_Fraccionamiento: string | null;
  i_CodigoPostal: number | null;
  i_TipoContacto: number;
  v_Municipio: string | null;
  v_NombreEstado: string | null;
}

export interface EmpresaPostPayload {
  ID_Empresa?: number;
  d_FechaAlta: string;
  d_FechaBaja: string | null;
  s_RazonSocial: string;
  s_RegistroPatronal: string;
  s_RepresentanteLegal: string;
  s_RFC: string;
  d_DiasCredito: string;
  s_GiroActividad: string;
  i_TipoDomicilio: number;
  v_NombreCalle: string;
  v_NumeroInterior: string;
  v_NumeroExterior: string;
  v_Fraccionamiento: string;
  i_TipoContacto: number;
  i_CodigoPostal: number;
  i_CveTenant: number;
}

export interface SP_CodigoPostal {
  i_CveCodigo: number;
  i_CodigoPostal: number;
  estado: string;
  v_Municipio: string;
  v_Ciudad: string;
  v_Asentamiento: string;
  v_TipoAsentamiento: string;
}
