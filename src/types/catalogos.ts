export interface rubros {
  i_CveRubro: number;
  v_Nombre: string;
}

export interface unidades {
  i_CveUnidad: number;
  v_Nombre: string;
  b_TipoDato: boolean;
  b_ModifCantEnAgenda: boolean;
}

export interface Norma {
  id: number;
  categoria_noms: string | null;
  nombre_noms: string | null;
  descripcion: string | null;
}

export interface Categorias {
  ID_Categoria: number;
  v_descripcion: string;
}

export interface entregables {
  i_CveEntregables: number;
  v_Nombre: string;
}
