export interface AlumnoPersonal {
  i_CveAlumno: number;
  i_CveEmpresa: number;
  v_Nomina: string;
  v_Nombre: string;
  v_CURP: string;
  v_Puesto: string;
  v_Planta: string;
}

export const plantasMock = ["Planta Guadalupe", "Planta Apodaca", "Planta Escobedo"];

// i_CveEmpresa se asigna con el ID de la empresa abierta
export const personalMock: Omit<AlumnoPersonal, "i_CveEmpresa">[] = [
  { i_CveAlumno: 1,  v_Nomina: "10234", v_Nombre: "JUAN CARLOS HERNÁNDEZ LÓPEZ",   v_CURP: "HELJ850312HNLRPN04", v_Puesto: "Operador de montacargas",                  v_Planta: "Planta Guadalupe" },
  { i_CveAlumno: 2,  v_Nomina: "10235", v_Nombre: "MARÍA FERNANDA GARZA TREVIÑO",  v_CURP: "GATF900724MNLRRR02", v_Puesto: "Supervisora de seguridad e higiene",       v_Planta: "Planta Guadalupe" },
  { i_CveAlumno: 3,  v_Nomina: "10241", v_Nombre: "JOSÉ LUIS MARTÍNEZ SALAZAR",    v_CURP: "MASL780105HNLRLS09", v_Puesto: "Soldador",                                 v_Planta: "Planta Apodaca" },
  { i_CveAlumno: 4,  v_Nomina: "10256", v_Nombre: "ROBERTO CANTÚ VILLARREAL",      v_CURP: "CAVR820917HNLNLB01", v_Puesto: "Técnico de mantenimiento eléctrico",       v_Planta: "Planta Apodaca" },
  { i_CveAlumno: 5,  v_Nomina: "10260", v_Nombre: "ANA LAURA RODRÍGUEZ FLORES",    v_CURP: "ROFA930430MNLDLN05", v_Puesto: "Inspectora de calidad",                    v_Planta: "Planta Guadalupe" },
  { i_CveAlumno: 6,  v_Nomina: "10272", v_Nombre: "MIGUEL ÁNGEL TORRES MENDOZA",   v_CURP: "TOMM880221HCLRNG07", v_Puesto: "Operador de grúa viajera",                 v_Planta: "Planta Escobedo" },
  { i_CveAlumno: 7,  v_Nomina: "10288", v_Nombre: "LUIS ALBERTO RAMÍREZ CASTILLO", v_CURP: "RACL910811HNLMSS03", v_Puesto: "Mecánico industrial",                      v_Planta: "Planta Escobedo" },
  { i_CveAlumno: 8,  v_Nomina: "10301", v_Nombre: "PATRICIA ELIZONDO GUERRA",      v_CURP: "EIGP860606MNLLRT06", v_Puesto: "Técnica en manejo de materiales peligrosos", v_Planta: "Planta Apodaca" },
  { i_CveAlumno: 9,  v_Nomina: "10315", v_Nombre: "FRANCISCO JAVIER LOZANO PEÑA",  v_CURP: "LOPF790119HTSZXR02", v_Puesto: "Operador de caldera",                      v_Planta: "Planta Escobedo" },
  { i_CveAlumno: 10, v_Nomina: "10322", v_Nombre: "DANIELA SÁNCHEZ ORTIZ",         v_CURP: "SAOD970314MNLNRN09", v_Puesto: "Almacenista",                              v_Planta: "Planta Guadalupe" },
  { i_CveAlumno: 11, v_Nomina: "10340", v_Nombre: "JESÚS EDUARDO MORALES RÍOS",    v_CURP: "MORJ840925HNLRSS00", v_Puesto: "Operador de prensa",                       v_Planta: "Planta Apodaca" },
  { i_CveAlumno: 12, v_Nomina: "10358", v_Nombre: "KARLA IVETH MEDINA SALINAS",    v_CURP: "MESK950702MNLDLR04", v_Puesto: "Brigadista de emergencias",                v_Planta: "Planta Escobedo" },
];
