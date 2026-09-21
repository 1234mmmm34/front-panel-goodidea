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
