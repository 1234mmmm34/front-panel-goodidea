// Catálogos e información base del Módulo PIPC v3.42 (fuente de verdad: captura_pipc_goodidea-4_modificado_v3_42.html)

export const APP_VERSION = 'v3.42';
export const SCHEMA_VERSION = '4.7';

export const TEXTO_OBJETIVO_PIPC = 'Establecer una organización que permita llevar a cabo acciones para el control de los diferentes tipos de emergencia que pudieran presentarse en las instalaciones de la empresa, con el fin de proteger la integridad física de las personas que laboran en el inmueble, así como a visitantes y población en general que pudiera verse afectada, a través de la implementación de medidas preventivas, de respuesta y de recuperación, conforme a los lineamientos establecidos por la Ley General de Protección Civil y sus reglamentos aplicables.';

export const TEXTO_ATENCION_MEDICA_BASE = 'El personal responsable de EHS y recursos humanos de “la empresa” en conjunto con los brigadistas de primeros auxilios cuentan con los números de emergencia y el procedimiento para solicitar el apoyo del centro de atención médica más cercano en caso de requerirse el traslado de lesionados.';

export const MUNICIPIOS_EMPRESA_OPCIONES = [
  'Apodaca',
  'Cadereyta Jiménez',
  'El Carmen',
  'García',
  'General Escobedo',
  'Guadalupe',
  'Juárez',
  'Monterrey',
  'Pesquería',
  'Salinas Victoria',
  'San Nicolás de los Garza',
  'San Pedro Garza García',
  'Santa Catarina',
  'Otro'
];

export const MESES_NOMBRE_MIN = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MESES_PROG: string[] = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export const CATALOGO_DIRECTORES_PC = {
    fuente: 'Datos_Directores_Dependencias_PC.docx',
    version: '2026.10.26',
    estado: { titular: 'Dr. Erik T. Cavazos Cavazos', cargo: 'Director de Protección Civil del Estado', dependencia: 'Dirección de Protección Civil del Estado de Nuevo León' },
    municipios: {
        'Monterrey': { titular: 'Comandante César Daniel Betancourt Saldaña', cargo: 'Director de Protección Civil de Monterrey', dependencia: 'Dirección de Protección Civil de la Secretaría de Seguridad y Protección Ciudadana del Municipio de Monterrey' },
        'San Nicolás de los Garza': { titular: 'Lic. Jorge Camacho Rincón', cargo: 'Director de Protección Civil de San Nicolás de los Garza', dependencia: 'Dirección de Protección Civil de San Nicolás de los Garza' },
        'Guadalupe': { titular: 'Ing. Fernando Escobedo Lara', cargo: 'Director de Protección Civil de Guadalupe', dependencia: 'Dirección de Protección Civil de Guadalupe' },
        'Apodaca': { titular: 'Ing. Alejandro Tovar Rodríguez', cargo: 'Director de Protección Civil de Apodaca', dependencia: 'Dirección de Protección Civil de Apodaca' },
        'San Pedro Garza García': { titular: 'Lic. Gilberto Alonso Almaguer Meléndez', cargo: 'Director de Protección Civil de San Pedro', dependencia: 'Dirección de Protección Civil de San Pedro' },
        'Santa Catarina': { titular: 'Comandante Israel Contreras Vázquez', cargo: 'Director de Protección Civil de Santa Catarina', dependencia: 'Dirección de Protección Civil de Santa Catarina' },
        'General Escobedo': { titular: 'Mtra. Patricia Pérez Tijerina', cargo: 'Directora de Protección Civil de Escobedo', dependencia: 'Dirección de Protección Civil de la Secretaría de Seguridad y Protección Ciudadana del Municipio de Escobedo' },
        'García': { titular: 'Mtro. Jesús Eduardo González Gómez', cargo: 'Director General de Protección Civil y Gestión Integral de Riesgos de García', dependencia: 'Dirección General de Protección Civil y Gestión Integral de Riesgos de García' }
    }
};

export const CATALOGO_DEPENDENCIAS_EMERGENCIA = {
    "catalogo": "dependencias_emergencia_nl",
    "version": "2026.06.22",
    "fuente": "Directorio de emergencia NL.xlsx",
    "ciudades": [
        {
            "municipio": "Apodaca",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Policía Municipal",
                    "telefono": "81 1772-2050",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 8302-9867",
                    "llegada": ""
                },
                {
                    "dependencia": "Central de Bomberos",
                    "telefono": "81 8386-2061",
                    "llegada": ""
                },
                {
                    "dependencia": "Cruz Roja Mexicana Delegación Apodaca",
                    "telefono": "81 1493 -2743",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "Cadereyta Jiménez",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Dirección General de Policía",
                    "telefono": "82 8284-0066",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "828 284 2525",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos",
                    "telefono": "828 284 2525",
                    "llegada": ""
                },
                {
                    "dependencia": "Clínica Municipal",
                    "telefono": "828 284 2525",
                    "llegada": ""
                },
                {
                    "dependencia": "Cruz Verde",
                    "telefono": "828 284 2525",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "El Carmen",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Seguridad Pública",
                    "telefono": "81 1502-6260",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 2581-0633",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "García",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Seguridad y Protección Ciudadana",
                    "telefono": "81 8862-7070",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 8862-9999",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos",
                    "telefono": "81 8147-1195",
                    "llegada": ""
                },
                {
                    "dependencia": "Cruz Roja",
                    "telefono": "65",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "General Escobedo",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "066",
                    "llegada": ""
                },
                {
                    "dependencia": "Seguridad Pública",
                    "telefono": "81 8286-9200",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 8397-2911",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos",
                    "telefono": "81 8342-0055",
                    "llegada": ""
                },
                {
                    "dependencia": "Cruz Roja",
                    "telefono": "065",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "Guadalupe",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Policía Municipal",
                    "telefono": "81 8135-5900",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 1771 8801",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos (Guadalupe)",
                    "telefono": "81 4040-0022",
                    "llegada": ""
                },
                {
                    "dependencia": "Cruz Roja",
                    "telefono": "81 1493 2735",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "Juárez",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Seguridad Pública y vialidad",
                    "telefono": "81 1771-2050",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 4468 -0410",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos",
                    "telefono": "81 4468 -0410",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "Monterrey",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Policía Municipal",
                    "telefono": "81 8125-9494/ 9400",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 5102-8917",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos Nuevo León (Central)",
                    "telefono": "81 8342-0053 / 54 / 55",
                    "llegada": ""
                },
                {
                    "dependencia": "Cruz Roja",
                    "telefono": "81 1477-1477",
                    "llegada": ""
                },
                {
                    "dependencia": "Hospital Metropolitano Urgencias",
                    "telefono": "81 8305-5900",
                    "llegada": ""
                },
                {
                    "dependencia": "Denuncia Anónima",
                    "telefono": "089",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "Pesquería",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "C4 emergencias",
                    "telefono": "82 5248-3052",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 4773-8402",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos",
                    "telefono": "81 4773-8402",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "Salinas Victoria",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Secretaría de Seguridad y Vialidad",
                    "telefono": "818-2370-181 /811-4151-615",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 1488-8228",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos",
                    "telefono": "81 1488-8228",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "San Nicolás de los Garza",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Policía Municipal",
                    "telefono": "81 8158-1330",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 8158-1330",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos (San Nicolás)",
                    "telefono": "81 8158-1330",
                    "llegada": ""
                },
                {
                    "dependencia": "Cruz Roja",
                    "telefono": "065",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "San Pedro Garza García",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Policía Municipal (C4)",
                    "telefono": "81 8988-2000",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 2127-2724",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos (San Pedro)",
                    "telefono": "81 8342-0055",
                    "llegada": ""
                },
                {
                    "dependencia": "Cruz Roja",
                    "telefono": "81 1477-1921",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "Santa Catarina",
            "dependencias": [
                {
                    "dependencia": "Emergencias General",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Policía Municipal y Tránsito",
                    "telefono": "81 8676-1900 / 1901 / 1902",
                    "llegada": ""
                },
                {
                    "dependencia": "Protección Civil Municipal",
                    "telefono": "81 8676-1866",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos",
                    "telefono": "81 1052-0700",
                    "llegada": ""
                },
                {
                    "dependencia": "Cruz Roja Santa Catarina",
                    "telefono": "81 1477-1927",
                    "llegada": ""
                },
                {
                    "dependencia": "Clínica Municipal",
                    "telefono": "81 8676-1870",
                    "llegada": ""
                }
            ]
        },
        {
            "municipio": "Estado de Nuevo León",
            "dependencias": [
                {
                    "dependencia": "Protección Civil Estatal",
                    "telefono": "81 8342-8555",
                    "llegada": ""
                },
                {
                    "dependencia": "Fuerza Civil (Policía Estatal)",
                    "telefono": "911",
                    "llegada": ""
                },
                {
                    "dependencia": "Cruz Roja Nuevo León",
                    "telefono": "81 8375-1212",
                    "llegada": ""
                },
                {
                    "dependencia": "Bomberos Nuevo León (General)",
                    "telefono": "81 8342-0055",
                    "llegada": ""
                },
                {
                    "dependencia": "Denuncia Anónima",
                    "telefono": "089",
                    "llegada": ""
                }
            ]
        }
    ]
};

export const PROGRESS_IGNORED_DIR_VALUES = [
  'Cruz Roja', 'Cruz Verde', 'Grupos de rescate voluntarios', 'Cuerpos de bomberos voluntarios', "ONG'S",
  'Pipas de agua', 'Extintores', 'Hidrantes'
];

export interface AgenteCatalogo {
  id: string;
  clave: string;
  numero: number | string;
  nombre: string;
  origen: 'externo' | 'interno';
  naturaleza: string;
  grupo: string;
  fenomeno: string;
  descripcion: string;
  brigadas: string[];
  brigadas_texto: string;
  recursos: string;
  textoWord: string;
}

export const CATALOGO_AGENTES = [
 {
  "id": "geo_01",
  "clave": "GEO-01",
  "numero": "7.1.1.1",
  "nombre": "Sismo",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Geológico",
  "grupo": "FENÓMENOS GEOLÓGICOS",
  "descripcion": "Fenómeno geológico · Natural · Externo",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios",
   "Búsqueda y Rescate",
   "Incendios"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios, Búsqueda y rescate, Combate de incendios",
  "recursos": "Botiquín, radio portátil, linternas, megáfono, señalización de rutas y zonas seguras, directorio de emergencias",
  "textoWord": "Un movimiento sísmico de mediana o gran magnitud podría provocar daños estructurales en el inmueble, caída de elementos no estructurales, lesiones al personal y pérdidas materiales. La empresa debe contar con procedimientos de respuesta sísmica, brigadas capacitadas y realizar simulacros periódicos conforme a los lineamientos de Protección Civil."
 },
 {
  "id": "geo_02",
  "clave": "GEO-02",
  "numero": "7.1.1.2",
  "nombre": "Inestabilidad de laderas / deslizamiento / derrumbe",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Geológico",
  "grupo": "FENÓMENOS GEOLÓGICOS",
  "descripcion": "Fenómeno geológico · Natural · Externo",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios",
   "Búsqueda y Rescate"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios, Búsqueda y rescate",
  "recursos": "Botiquín, radio portátil, linternas, equipo básico de remoción (palas, barretas) para brigadistas capacitados",
  "textoWord": "El movimiento de masas de tierra o roca en taludes o laderas cercanas a las instalaciones, así como la caída de materiales naturales o constructivos, podría afectar las vialidades de acceso, las instalaciones periféricas y las vías de evacuación, y provocar lesiones al personal y daños a equipos. La empresa debe identificar las zonas de riesgo en su entorno y dentro del inmueble, mantener en buenas condiciones sus estructuras y taludes, y establecer medidas preventivas y procedimientos de respuesta ante este tipo de eventos."
 },
 {
  "id": "geo_03",
  "clave": "GEO-03",
  "numero": "7.1.1.3",
  "nombre": "Hundimiento / subsidencia / agrietamiento",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Geológico",
  "grupo": "FENÓMENOS GEOLÓGICOS",
  "descripcion": "Fenómeno geológico · Natural · Externo",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios",
   "Búsqueda y Rescate",
   "Incendios"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios, Búsqueda y rescate, Combate de incendios",
  "recursos": "Botiquín, linternas, radio, cinta de acordonamiento, equipo básico de emergencia",
  "textoWord": "El hundimiento, la subsidencia o el agrietamiento del terreno en la zona puede generar grietas en estructuras, daños en instalaciones hidráulicas y eléctricas subterráneas y, en casos graves, comprometer la integridad estructural del inmueble y la seguridad del personal. La empresa debe realizar inspecciones periódicas de las condiciones del suelo y de las instalaciones, dar seguimiento a cualquier evidencia de afectación y coordinarse con las autoridades competentes para atenderla de inmediato."
 },
 {
  "id": "hid_01",
  "clave": "HID-01",
  "numero": "7.1.2.1",
  "nombre": "Ciclón tropical (huracán)",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Hidrometeorológico",
  "grupo": "FENÓMENOS HIDROMETEOROLÓGICOS",
  "descripcion": "Fenómeno hidrometeorológico · Natural · Externo",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios",
  "recursos": "Linternas, megáfono, bombas sumergibles, costales de arena, plástico, botiquín, radio, bitácora de seguimiento",
  "textoWord": "Por la ubicación de las instalaciones las fuertes lluvias o huracanes podrían llegar a ocasionar daños principalmente a las estructuras. La empresa debe contar con procedimientos establecidos para la atención a este tipo de fenómenos naturales, así como acatar las indicaciones que la Dirección de Protección Civil emitan."
 },
 {
  "id": "hid_02",
  "clave": "HID-02",
  "numero": "7.1.2.2",
  "nombre": "Inundación pluvial o fluvial",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Hidrometeorológico",
  "grupo": "FENÓMENOS HIDROMETEOROLÓGICOS",
  "descripcion": "Fenómeno hidrometeorológico · Natural · Externo",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios",
   "Incendios"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios, Combate de incendios",
  "recursos": "Costales de arena, bombas sumergibles con fuente de respaldo (planta de emergencia o bomba a gasolina), lámparas de emergencia, linternas, radios con baterías de repuesto, botiquín, directorio de emergencias",
  "textoWord": "Las precipitaciones intensas o el desbordamiento de causes en la zona podrían provocar acumulación de agua en áreas bajas de las instalaciones, causando daños a equipos, materiales e infraestructura, así como riesgo para el personal. La empresa debe mantener sus sistemas de drenaje en condiciones óptimas y contar con procedimientos de respuesta ante este fenómeno."
 },
 {
  "id": "hid_03",
  "clave": "HID-03",
  "numero": "7.1.2.3",
  "nombre": "Tormenta eléctrica",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Hidrometeorológico",
  "grupo": "FENÓMENOS HIDROMETEOROLÓGICOS",
  "descripcion": "Fenómeno hidrometeorológico · Natural · Externo",
  "brigadas": [
   "Evacuación",
   "Incendios"
  ],
  "brigadas_texto": "Evacuación, Combate de incendios",
  "recursos": "Sistema de pararrayos, protección contra sobretensiones, radio, cinta de acordonamiento",
  "textoWord": "Las descargas eléctricas atmosféricas representan un riesgo para las instalaciones y el personal que se encuentre en exteriores, pudiendo provocar incendios, daños a equipos eléctricos y electrónicos. La empresa debe contar con sistemas de pararrayos, protección de equipos y procedimientos para resguardar al personal ante este fenómeno."
 },
 {
  "id": "hid_04",
  "clave": "HID-04",
  "numero": "7.1.2.4",
  "nombre": "Granizada",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Hidrometeorológico",
  "grupo": "FENÓMENOS HIDROMETEOROLÓGICOS",
  "descripcion": "Fenómeno hidrometeorológico · Natural · Externo",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios",
  "recursos": "Plástico, cartón o madera para protección, cobertores para vehículos, radio",
  "textoWord": "La caída de granizo puede provocar daños en techos, cubiertas, vehículos y equipos expuestos en el exterior de las instalaciones, así como riesgo para el personal que se encuentre en áreas abiertas. La empresa debe contar con protocolos para salvaguardar al personal y los bienes materiales ante este fenómeno."
 },
 {
  "id": "hid_05",
  "clave": "HID-05",
  "numero": "7.1.2.5",
  "nombre": "Nevada / helada / onda gélida",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Hidrometeorológico",
  "grupo": "FENÓMENOS HIDROMETEOROLÓGICOS",
  "descripcion": "Fenómeno hidrometeorológico · Natural · Externo",
  "brigadas": [
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Primeros auxilios",
  "recursos": "Aislante para tuberías, cobijas, bebidas calientes, calentadores con ventilación adecuada",
  "textoWord": "El descenso extremo de temperatura puede ocasionar daños en tuberías, estructuras y equipos expuestos, así como condiciones de riesgo para el personal por caídas en superficies heladas o dificultad de movilidad. La empresa debe implementar medidas preventivas de protección de instalaciones y personal ante este fenómeno."
 },
 {
  "id": "hid_06",
  "clave": "HID-06",
  "numero": "7.1.2.6",
  "nombre": "Onda cálida / golpe de calor",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Hidrometeorológico",
  "grupo": "FENÓMENOS HIDROMETEOROLÓGICOS",
  "descripcion": "Fenómeno hidrometeorológico · Natural · Externo · gestión / salud ocupacional",
  "brigadas": [
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Primeros auxilios",
  "recursos": "Puntos de hidratación, áreas de sombra o descanso, ventilación",
  "textoWord": "Las temperaturas extremadamente altas, frecuentes en la región durante el verano, pueden provocar golpe de calor, deshidratación y agotamiento en el personal, especialmente en quienes laboran en exteriores o cerca de fuentes de calor, además de sobrecargar los equipos y las instalaciones eléctricas. La empresa debe establecer medidas de hidratación, pausas y rotación de actividades, ventilación y áreas de descanso frescas, así como capacitar al personal para reconocer y atender los síntomas del golpe de calor."
 },
 {
  "id": "hid_07",
  "clave": "HID-07",
  "numero": "7.1.2.7",
  "nombre": "Sequía",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Hidrometeorológico",
  "grupo": "FENÓMENOS HIDROMETEOROLÓGICOS",
  "descripcion": "Fenómeno hidrometeorológico · Natural · Externo · gestión",
  "brigadas": [],
  "brigadas_texto": "No requiere brigada; lo atiende el área responsable",
  "recursos": "Reservas de agua (tinacos o cisterna), agua embotellada",
  "textoWord": "Un período prolongado de escasez de agua puede afectar el abastecimiento hídrico de la instalación y los procesos que requieren agua, además de incrementar el riesgo de incendio por condiciones de sequedad en el entorno. La empresa debe contar con planes de contingencia de abastecimiento y medidas adicionales de prevención de incendios."
 },
 {
  "id": "hid_08",
  "clave": "HID-08",
  "numero": "7.1.2.8",
  "nombre": "Vientos fuertes / tornado",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Hidrometeorológico",
  "grupo": "FENÓMENOS HIDROMETEOROLÓGICOS",
  "descripcion": "Fenómeno hidrometeorológico · Natural · Externo",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios",
  "recursos": "Megáfono, botiquín, radio",
  "textoWord": "Los vientos fuertes y, de forma excepcional, los tornados pueden desprender techumbres, láminas, anuncios y elementos sueltos, derribar árboles y postes, y proyectar objetos que causen lesiones al personal y daños a las instalaciones. La empresa debe asegurar los elementos expuestos al viento, dar mantenimiento a cubiertas y estructuras ligeras, mantener podado el arbolado cercano y contar con procedimientos de resguardo para el personal."
 },
 {
  "id": "qt_01",
  "clave": "QT-01",
  "numero": "7.1.3.1",
  "nombre": "Incendio",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Químico-Tecnológico",
  "grupo": "FENÓMENOS QUÍMICO-TECNOLÓGICOS",
  "descripcion": "Fenómeno químico-tecnológico · Antropogénico · Externo",
  "brigadas": [
   "Evacuación",
   "Incendios"
  ],
  "brigadas_texto": "Evacuación, Combate de incendios",
  "recursos": "Puntos de reunión alternos, radio, directorio de emergencias",
  "textoWord": "Un incendio en empresas, predios o vialidades aledañas podría propagarse hacia las instalaciones o afectarlas por calor radiante, humo y caída de pavesas, comprometiendo la seguridad del personal y la continuidad de la operación. La empresa debe identificar los riesgos de incendio en su entorno inmediato, mantener libres de material combustible las áreas colindantes y establecer protocolos de respuesta y resguardo ante este tipo de eventos externos."
 },
 {
  "id": "qt_02",
  "clave": "QT-02",
  "numero": "7.1.3.2",
  "nombre": "Explosión / BLEVE en el entorno",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Químico-Tecnológico",
  "grupo": "FENÓMENOS QUÍMICO-TECNOLÓGICOS",
  "descripcion": "Fenómeno químico-tecnológico · Antropogénico · Externo",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios",
   "HAZMAT"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios, HazMat",
  "recursos": "Guía de Respuesta en Emergencias (GRE 2024), puntos de reunión alternos",
  "textoWord": "Una explosión en empresas, vialidades o instalaciones cercanas que manejen materiales peligrosos, incluida la expansión explosiva de un recipiente con gas o líquido a presión (BLEVE), podría generar onda expansiva, proyección de fragmentos, calor radiante y nubes tóxicas que afecten las instalaciones y al personal. La empresa debe identificar las fuentes de este riesgo en su entorno y establecer protocolos de evacuación, resguardo y comunicación con los cuerpos de emergencia."
 },
 {
  "id": "qt_03",
  "clave": "QT-03",
  "numero": "7.1.3.3",
  "nombre": "Fuga tóxica",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Químico-Tecnológico",
  "grupo": "FENÓMENOS QUÍMICO-TECNOLÓGICOS",
  "descripcion": "Fenómeno químico-tecnológico · Antropogénico · Externo",
  "brigadas": [
   "Evacuación",
   "HAZMAT"
  ],
  "brigadas_texto": "Evacuación, HazMat",
  "recursos": "Indicador de dirección del viento, GRE 2024, directorio de emergencias",
  "textoWord": "La liberación de gases o vapores tóxicos en instalaciones, ductos o vehículos de transporte cercanos podría formar una nube que alcance el inmueble y provoque intoxicaciones en el personal. La empresa debe identificar las fuentes de sustancias peligrosas en su entorno, establecer procedimientos de resguardo en sitio o evacuación según la dirección del viento y coordinarse con las autoridades y los cuerpos de emergencia."
 },
 {
  "id": "qt_04",
  "clave": "QT-04",
  "numero": "7.1.3.4",
  "nombre": "Derrame de sustancias",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Químico-Tecnológico",
  "grupo": "FENÓMENOS QUÍMICO-TECNOLÓGICOS",
  "descripcion": "Fenómeno químico-tecnológico · Antropogénico · Externo",
  "brigadas": [
   "Evacuación",
   "HAZMAT"
  ],
  "brigadas_texto": "Evacuación, HazMat",
  "recursos": "Material para proteger coladeras, GRE 2024, directorio de emergencias",
  "textoWord": "La liberación accidental de sustancias peligrosas en vialidades o instalaciones vecinas puede generar contaminación, evacuaciones obligatorias o afectaciones al personal por exposición a vapores o líquidos tóxicos. La empresa debe conocer las sustancias manejadas en su entorno y contar con protocolos de evacuación y comunicación con autoridades."
 },
 {
  "id": "se_01",
  "clave": "SE-01",
  "numero": "7.1.4.1",
  "nombre": "Epidemia / pandemia",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Sanitario-Ecológico",
  "grupo": "FENÓMENOS SANITARIO-ECOLÓGICOS",
  "descripcion": "Fenómeno sanitario-ecológico · Antropogénico · Externo",
  "brigadas": [
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Primeros auxilios",
  "recursos": "Filtro de acceso, EPP sanitario, protocolo de contingencia sanitaria",
  "textoWord": "La propagación de enfermedades infecciosas en la comunidad o región puede afectar la salud del personal, generar ausentismo masivo y requerir la implementación de medidas de contingencia sanitaria. La empresa debe contar con protocolos de respuesta ante emergencias sanitarias y mantener comunicación con las autoridades de salud."
 },
 {
  "id": "se_02",
  "clave": "SE-02",
  "numero": "7.1.4.2",
  "nombre": "Plaga / fauna nociva",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Sanitario-Ecológico",
  "grupo": "FENÓMENOS SANITARIO-ECOLÓGICOS",
  "descripcion": "Fenómeno sanitario-ecológico · Antropogénico · Externo",
  "brigadas": [],
  "brigadas_texto": "No requiere brigada; lo atiende el área responsable",
  "recursos": "Barreras físicas perimetrales",
  "textoWord": "La infestación de insectos, roedores u otros organismos provenientes del entorno puede contaminar productos, dañar instalaciones y representar riesgos sanitarios para el personal. La empresa debe implementar programas preventivos de control de plagas y mantener las condiciones de higiene necesarias para evitar su propagación."
 },
 {
  "id": "so_01",
  "clave": "SO-01",
  "numero": "7.1.5.1",
  "nombre": "Manifestación / bloqueo de accesos",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Externo",
  "brigadas": [
   "Evacuación"
  ],
  "brigadas_texto": "Evacuación",
  "recursos": "Planta de emergencia, cerraduras y candados en buen estado, línea directa con policía",
  "textoWord": "La obstrucción de las vías de acceso al inmueble puede impedir la llegada de personal, servicios de emergencia o el abastecimiento de insumos necesarios para la operación. La empresa debe identificar rutas alternas de acceso y establecer procedimientos para mantener la comunicación y la seguridad del personal ante este escenario."
 },
 {
  "id": "so_02",
  "clave": "SO-02",
  "numero": "7.1.5.2",
  "nombre": "Terrorismo / sabotaje (entorno)",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Externo",
  "brigadas": [
   "Evacuación"
  ],
  "brigadas_texto": "Evacuación",
  "recursos": "CCTV perimetral, control de acceso, directorio de emergencias",
  "textoWord": "Los actos de terrorismo o sabotaje en el entorno de las instalaciones, como ataques a infraestructura, incendios provocados o daños intencionales a servicios, pueden poner en riesgo al personal y afectar la operación. La empresa debe mantener controles de acceso y vigilancia, reportar actividades sospechosas a las autoridades y contar con procedimientos de evacuación y resguardo ante este tipo de amenazas."
 },
 {
  "id": "so_03",
  "clave": "SO-03",
  "numero": "7.1.5.3",
  "nombre": "Vandalismo",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Externo",
  "brigadas": [],
  "brigadas_texto": "No requiere brigada; lo atiende el área responsable",
  "recursos": "Iluminación perimetral, CCTV",
  "textoWord": "Los actos de vandalismo contra las instalaciones, como daños a bardas, vehículos, señalización o equipos expuestos, pueden generar pérdidas materiales y condiciones inseguras para el personal. La empresa debe mantener vigilancia, iluminación y controles de acceso adecuados, reparar oportunamente los daños y presentar las denuncias correspondientes ante las autoridades."
 },
 {
  "id": "so_04",
  "clave": "SO-04",
  "numero": "7.1.5.4",
  "nombre": "Robo / asalto con violencia",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Externo",
  "brigadas": [
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Primeros auxilios",
  "recursos": "Alarma silenciosa, CCTV, vigilancia",
  "textoWord": "La sustracción de bienes, vehículos o equipos por personas ajenas a la empresa conlleva el riesgo asociado de violencia hacia el personal. La empresa debe implementar medidas de seguridad física, control de accesos y protocolos de respuesta ante este tipo de eventos para proteger la integridad de su personal y sus bienes."
 },
 {
  "id": "so_05",
  "clave": "SO-05",
  "numero": "7.1.5.5",
  "nombre": "Secuestro de alto ejecutivo",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Externo",
  "brigadas": [],
  "brigadas_texto": "No requiere brigada; lo atiende el área responsable",
  "recursos": "Directorio de autoridades, teléfono institucional libre, CCTV",
  "textoWord": "La privación ilegal de la libertad de directivos o personal clave representa un riesgo grave para la integridad de las personas y puede afectar la continuidad operativa de la empresa. La empresa debe implementar medidas de seguridad para su personal directivo y contar con protocolos de respuesta y comunicación ante este tipo de eventos."
 },
 {
  "id": "so_06",
  "clave": "SO-06",
  "numero": "7.1.5.6",
  "nombre": "Accidente de transporte (aéreo / terrestre / ferroviario)",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Externo",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios",
  "recursos": "Señalización en cruces, CCTV, directorio (PC, Cruz Roja, bomberos, empresa transportista)",
  "textoWord": "Los accidentes de transporte aéreo, terrestre o ferroviario en vialidades, vías férreas o rutas cercanas a la instalación, como colisiones, descarrilamientos, volcaduras o la caída de una aeronave, pueden generar derrame de materiales peligrosos, incendios, explosiones u obstrucción de accesos que afecten la operación y la seguridad del personal. La empresa debe identificar las rutas y vías de transporte de su entorno y establecer protocolos de respuesta ante este tipo de eventos."
 },
 {
  "id": "so_07",
  "clave": "SO-07",
  "numero": "7.1.5.7",
  "nombre": "Interrupción de servicios vitales",
  "origen": "externo",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Externo",
  "brigadas": [
   "Evacuación"
  ],
  "brigadas_texto": "Evacuación",
  "recursos": "Lámparas de emergencia, linternas, reservas de agua y gas, teléfono móvil, agua embotellada",
  "textoWord": "El corte prolongado de energía eléctrica, gas, agua o telecomunicaciones puede interrumpir la operación normal de la empresa y comprometer las medidas de seguridad. La empresa debe contar con sistemas de respaldo (plantas de emergencia, cisternas, comunicación alterna) y procedimientos para la gestión de este tipo de contingencias."
 },
 {
  "id": "ast_01",
  "clave": "AST-01",
  "numero": "7.1.6.1",
  "nombre": "Impacto de meteorito / tormenta magnética",
  "origen": "externo",
  "naturaleza": "Natural",
  "fenomeno": "Astronómico",
  "grupo": "FENÓMENOS ASTRONÓMICOS",
  "descripcion": "Fenómeno astronómico · Natural · Externo",
  "brigadas": [],
  "brigadas_texto": "No requiere brigada; lo atiende el área responsable",
  "recursos": "---",
  "textoWord": "El impacto de un meteorito o una tormenta magnética de origen solar son fenómenos de muy baja probabilidad; una tormenta magnética intensa podría afectar las telecomunicaciones, los sistemas de posicionamiento y la red eléctrica, interrumpiendo servicios necesarios para la operación. La empresa debe atender los avisos de las autoridades y contar con procedimientos para operar ante la interrupción de servicios."
 },
 {
  "id": "qt_05",
  "clave": "QT-05",
  "numero": "7.2.1.1",
  "nombre": "Incendio",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Químico-Tecnológico",
  "grupo": "FENÓMENOS QUÍMICO-TECNOLÓGICOS",
  "descripcion": "Fenómeno químico-tecnológico · Antropogénico · Interno",
  "brigadas": [
   "Incendios",
   "Evacuación",
   "Primeros Auxilios",
   "Búsqueda y Rescate",
   "HAZMAT"
  ],
  "brigadas_texto": "Combate de incendios, Evacuación, Primeros auxilios, Búsqueda y rescate, HazMat",
  "recursos": "Extintores por clase de fuego, detectores y alarma, equipo de brigada, botiquín, directorio de bomberos",
  "textoWord": "El inicio y propagación de fuego dentro de las instalaciones por cortocircuito, sobrecarga, chispa o ignición de materiales combustibles puede derivar en pérdidas materiales y humanas de consideración. La empresa debe mantener en buen estado sus instalaciones eléctricas, contar con equipos de detección y combate de incendios y capacitar a sus brigadas de emergencia."
 },
 {
  "id": "qt_06",
  "clave": "QT-06",
  "numero": "7.2.1.2",
  "nombre": "Explosión",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Químico-Tecnológico",
  "grupo": "FENÓMENOS QUÍMICO-TECNOLÓGICOS",
  "descripcion": "Fenómeno químico-tecnológico · Antropogénico · Interno",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios",
   "Búsqueda y Rescate",
   "Incendios",
   "HAZMAT"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios, Búsqueda y rescate, Combate de incendios, HazMat",
  "recursos": "Explosímetro, sistema de tierras físicas, botiquín, cinta de acordonamiento",
  "textoWord": "La ignición de mezclas inflamables o explosivas dentro del inmueble generada por fuentes internas de calor, chispa o llama puede causar destrucción de instalaciones y lesiones graves al personal. La empresa debe identificar y controlar las fuentes de ignición, almacenar adecuadamente los materiales inflamables y mantener operativos los sistemas de detección y supresión de incendios."
 },
 {
  "id": "qt_07",
  "clave": "QT-07",
  "numero": "7.2.1.3",
  "nombre": "Fuga de gas",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Químico-Tecnológico",
  "grupo": "FENÓMENOS QUÍMICO-TECNOLÓGICOS",
  "descripcion": "Fenómeno químico-tecnológico · Antropogénico · Interno (Gas natural + Gas L.P.)",
  "brigadas": [
   "HAZMAT",
   "Evacuación",
   "Incendios"
  ],
  "brigadas_texto": "HazMat, Evacuación, Combate de incendios",
  "recursos": "Explosímetro calibrado, agua jabonosa, EPP para reparación, cinta de acordonamiento, HDS del gas",
  "textoWord": "El escape de gases, vapores o líquidos a través de tuberías, válvulas o recipientes defectuosos puede generar atmósferas tóxicas, explosivas o deficientes en oxígeno que representen un riesgo grave para el personal. La empresa debe implementar programas de mantenimiento preventivo, detección de fugas y procedimientos de respuesta ante este tipo de emergencias."
 },
 {
  "id": "qt_08",
  "clave": "QT-08",
  "numero": "7.2.1.4",
  "nombre": "Derrame de sustancias",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Químico-Tecnológico",
  "grupo": "FENÓMENOS QUÍMICO-TECNOLÓGICOS",
  "descripcion": "Fenómeno químico-tecnológico · Antropogénico · Interno",
  "brigadas": [
   "HAZMAT",
   "Evacuación",
   "Primeros Auxilios",
   "Incendios"
  ],
  "brigadas_texto": "HazMat, Evacuación, Primeros auxilios, Combate de incendios",
  "recursos": "Kit antiderrames, material absorbente no inflamable, EPP según HDS, contenedores para residuo peligroso",
  "textoWord": "La liberación accidental de sustancias líquidas dentro de las instalaciones puede generar contaminación, riesgo de resbalones, incendios o intoxicaciones del personal. La empresa debe contar con procedimientos de contención y limpieza de derrames, equipos de protección personal adecuados y capacitación del personal para la atención segura de este tipo de eventos."
 },
 {
  "id": "qt_09",
  "clave": "QT-09",
  "numero": "7.2.1.5",
  "nombre": "Radiación",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Químico-Tecnológico",
  "grupo": "FENÓMENOS QUÍMICO-TECNOLÓGICOS",
  "descripcion": "Fenómeno químico-tecnológico · Antropogénico · Interno",
  "brigadas": [
   "Evacuación"
  ],
  "brigadas_texto": "Evacuación",
  "recursos": "Dosímetros y señalización (solo si aplica)",
  "textoWord": "El uso de equipos o fuentes que emiten radiación ionizante, como equipos de rayos X para inspección o medidores nucleares, puede exponer al personal a dosis nocivas si fallan los blindajes o no se siguen los procedimientos de seguridad. La empresa debe contar con las licencias y el personal autorizado que exige la autoridad, señalizar y delimitar las áreas, y mantener procedimientos de respuesta ante la pérdida de control de una fuente."
 },
 {
  "id": "se_03",
  "clave": "SE-03",
  "numero": "7.2.2.1",
  "nombre": "Brote epidemiológico",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Sanitario-Ecológico",
  "grupo": "FENÓMENOS SANITARIO-ECOLÓGICOS",
  "descripcion": "Fenómeno sanitario-ecológico · Antropogénico · Interno",
  "brigadas": [
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Primeros auxilios",
  "recursos": "Área de aislamiento temporal, gel antibacterial, cubrebocas, material de desinfección",
  "textoWord": "La propagación de enfermedades infecciosas entre el personal de la empresa puede derivar en ausentismo masivo, cierre temporal de operaciones y requerimientos de desinfección de instalaciones. La empresa debe implementar medidas de higiene, protocolos de respuesta ante brotes sanitarios y mantener comunicación con las autoridades de salud."
 },
 {
  "id": "se_04",
  "clave": "SE-04",
  "numero": "7.2.2.2",
  "nombre": "Plaga / fauna nociva",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Sanitario-Ecológico",
  "grupo": "FENÓMENOS SANITARIO-ECOLÓGICOS",
  "descripcion": "Fenómeno sanitario-ecológico · Antropogénico · Interno",
  "brigadas": [],
  "brigadas_texto": "No requiere brigada; lo atiende el área responsable",
  "recursos": "Contrato con proveedor de control de plagas, HDS de los productos, contenedores para residuo peligroso",
  "textoWord": "La infestación de roedores, insectos u otros organismos dentro de las instalaciones puede dañar materiales, equipos y productos, además de representar riesgos sanitarios para el personal. La empresa debe mantener programas continuos de control de plagas, condiciones adecuadas de higiene y sellado de accesos que permitan el ingreso de fauna nociva."
 },
 {
  "id": "se_05",
  "clave": "SE-05",
  "numero": "7.2.2.3",
  "nombre": "Contaminación de aire / agua / suelo (proceso)",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Sanitario-Ecológico",
  "grupo": "FENÓMENOS SANITARIO-ECOLÓGICOS",
  "descripcion": "Fenómeno sanitario-ecológico · Antropogénico · Interno · gestión ambiental",
  "brigadas": [],
  "brigadas_texto": "No requiere brigada; lo atiende el área responsable",
  "recursos": "Contención en áreas de manejo, almacén de residuos peligrosos",
  "textoWord": "Las emisiones a la atmósfera, descargas de aguas residuales o derrames al suelo derivados de los procesos de la empresa pueden contaminar el ambiente y afectar la salud del personal y de la población vecina. La empresa debe operar y dar mantenimiento a sus sistemas de control de emisiones y tratamiento, manejar adecuadamente sus residuos y contar con procedimientos de contención y notificación a las autoridades ambientales."
 },
 {
  "id": "so_08",
  "clave": "SO-08",
  "numero": "7.2.3.1",
  "nombre": "Concentración masiva / estampida",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Interno",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios",
  "recursos": "Señalización de aforo y salidas, megáfono",
  "textoWord": "La concentración de un gran número de personas en el inmueble, por ejemplo en cambios de turno, eventos o comedores, puede derivar en una estampida si se presenta una situación de pánico, con riesgo de caídas, aplastamientos y lesiones. La empresa debe controlar los aforos, mantener libres y señalizadas las rutas de evacuación y salidas de emergencia, y capacitar a las brigadas para conducir al personal de forma ordenada."
 },
 {
  "id": "so_09",
  "clave": "SO-09",
  "numero": "7.2.3.2",
  "nombre": "Amenaza de bomba / artefacto explosivo",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Interno",
  "brigadas": [
   "Evacuación",
   "Búsqueda y Rescate"
  ],
  "brigadas_texto": "Evacuación, Búsqueda y rescate",
  "recursos": "Formato de registro de llamada de amenaza, layout del inmueble, alarma audible",
  "textoWord": "La recepción de un aviso o comunicación sobre la presencia de un artefacto explosivo en las instalaciones obliga a activar de forma inmediata los protocolos de evacuación total y notificación a las autoridades competentes. La empresa debe capacitar a su personal en el manejo de este tipo de amenazas y tener claramente definidos los procedimientos de respuesta."
 },
 {
  "id": "so_10",
  "clave": "SO-10",
  "numero": "7.2.3.3",
  "nombre": "Robo interno",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Interno",
  "brigadas": [],
  "brigadas_texto": "No requiere brigada; lo atiende el área responsable",
  "recursos": "Inventario de equipo y materiales, CCTV, control de acceso",
  "textoWord": "La sustracción de bienes, materiales o información por parte del propio personal de la empresa puede generar pérdidas económicas y conflictos internos que deriven en situaciones de riesgo. La empresa debe implementar controles de acceso, inventarios periódicos y un clima organizacional que prevenga este tipo de conductas."
 },
 {
  "id": "so_11",
  "clave": "SO-11",
  "numero": "7.2.3.4",
  "nombre": "Huelga / paro",
  "origen": "interno",
  "naturaleza": "Antropogénico",
  "fenomeno": "Socio-Organizativo",
  "grupo": "FENÓMENOS SOCIO-ORGANIZATIVOS",
  "descripcion": "Fenómeno socio-organizativo · Antropogénico · Interno",
  "brigadas": [
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Primeros auxilios",
  "recursos": "Asesoría legal, voceros designados, control de acceso",
  "textoWord": "Un paro de actividades del personal puede interrumpir la operación, limitar el acceso a las instalaciones y generar situaciones de conflicto que deriven en riesgos para la seguridad. La empresa debe establecer canales de comunicación efectivos y procedimientos para garantizar la seguridad de las instalaciones y del personal durante este tipo de contingencias."
 },
 {
  "id": "aux_01",
  "clave": "AUX-01",
  "numero": "7.2.4.1",
  "nombre": "Emergencia médica / lesionado grave",
  "origen": "interno",
  "naturaleza": "Escenario de auxilio",
  "fenomeno": "Escenario de auxilio",
  "grupo": "ESCENARIOS DE AUXILIO",
  "descripcion": "Escenario de auxilio · Interno · Riesgo de trabajo (agrupa maquinaria, montacargas y vehículos, contacto eléctrico y golpe de calor)",
  "brigadas": [
   "Primeros Auxilios",
   "Evacuación"
  ],
  "brigadas_texto": "Primeros auxilios, Evacuación",
  "recursos": "Botiquín, camilla, directorio (911, Cruz Roja, unidad médica en convenio), extintores tipo C, material no conductor, área fresca y compresas para golpe de calor",
  "textoWord": "Los riesgos de trabajo propios de la operación, como el atrapamiento o golpe con maquinaria, el choque o atropellamiento con montacargas y vehículos internos, el contacto con partes energizadas y las fallas de las instalaciones eléctricas, así como el golpe de calor, pueden causar lesiones graves o fatales al personal y requerir atención médica inmediata. La empresa debe mantener guardas y dispositivos de seguridad en la maquinaria, rutas y señalización para vehículos, mantenimiento preventivo de sus instalaciones eléctricas y capacitación del personal, así como contar con personal de primeros auxilios y un procedimiento de atención y traslado de lesionados."
 },
 {
  "id": "aux_02",
  "clave": "AUX-02",
  "numero": "7.2.4.2",
  "nombre": "Inundación interna por falla de instalaciones hidráulicas",
  "origen": "interno",
  "naturaleza": "Escenario de auxilio",
  "fenomeno": "Escenario de auxilio",
  "grupo": "ESCENARIOS DE AUXILIO",
  "descripcion": "Escenario de auxilio · Interno · Falla de instalaciones",
  "brigadas": [
   "Evacuación",
   "Primeros Auxilios"
  ],
  "brigadas_texto": "Evacuación, Primeros auxilios",
  "recursos": "Plano de llaves de corte, costales o barreras, bomba, jaladores, material absorbente, lámparas de emergencia, guantes y botas",
  "textoWord": "La ruptura de tuberías, tinacos, cisternas, calentadores o rociadores puede provocar la inundación de áreas del inmueble, con riesgo de daños a equipos, materiales e instalaciones eléctricas, así como de resbalones y electrocución del personal. La empresa debe dar mantenimiento preventivo a sus instalaciones hidráulicas, identificar las válvulas de corte y tableros eléctricos, y contar con procedimientos para cortar el suministro y controlar el agua."
 }
];

export interface GrupoAgentes {
  grupo: string;
  agentes: AgenteCatalogo[];
}

export function agruparAgentes(filtro: (a: AgenteCatalogo) => boolean): GrupoAgentes[] {
  const grupos: GrupoAgentes[] = [];
  (CATALOGO_AGENTES as AgenteCatalogo[]).filter(filtro).forEach((ag) => {
    let g = grupos.length ? grupos[grupos.length - 1] : null;
    if (!g || g.grupo !== ag.grupo) {
      g = { grupo: ag.grupo, agentes: [] };
      grupos.push(g);
    }
    g.agentes.push(ag);
  });
  return grupos;
}

export const agentesExt = agruparAgentes((a) => a.origen === 'externo');
export const agentesExtNat = agruparAgentes((a) => a.origen === 'externo' && a.naturaleza === 'Natural');
export const agentesExtHum = agruparAgentes((a) => a.origen === 'externo' && a.naturaleza !== 'Natural');
export const agentesInt = agruparAgentes((a) => a.origen === 'interno');

export function getAllAgentesBase(): AgenteCatalogo[] {
  return (CATALOGO_AGENTES as AgenteCatalogo[]).slice();
}

export const riskMatrix: Record<string, Record<string, string>> = {
    // [probabilidad][consecuencia]
    'IMPROBABLE': { 'POCO SIGNIFICATIVAS': 'BAJO', 'MODERADAS': 'MEDIO', 'CRITICAS': 'MEDIO', 'DESASTROSAS': 'MEDIO' },
    'RARO': { 'POCO SIGNIFICATIVAS': 'BAJO', 'MODERADAS': 'MEDIO', 'CRITICAS': 'MEDIO', 'DESASTROSAS': 'ALTO' },
    'OCASIONAL': { 'POCO SIGNIFICATIVAS': 'BAJO', 'MODERADAS': 'MEDIO', 'CRITICAS': 'ALTO', 'DESASTROSAS': 'ALTO' },
    'PROBABLE': { 'POCO SIGNIFICATIVAS': 'MEDIO', 'MODERADAS': 'MEDIO', 'CRITICAS': 'ALTO', 'DESASTROSAS': 'ALTO' },
    'FRECUENTE': { 'POCO SIGNIFICATIVAS': 'MEDIO', 'MODERADAS': 'MEDIO', 'CRITICAS': 'ALTO', 'DESASTROSAS': 'ALTO' },
};

export const magnitudColors: Record<string, string> = { 'BAJO': '#2e9e42', 'MEDIO': '#f1c40f', 'ALTO': '#e02020' };

export const PROBABILIDADES_VALIDAS = ['IMPROBABLE', 'RARO', 'OCASIONAL', 'PROBABLE', 'FRECUENTE'];

export const CONSECUENCIAS_VALIDAS = ['POCO SIGNIFICATIVAS', 'MODERADAS', 'CRITICAS', 'DESASTROSAS'];

export const probLegacyMap: Record<string, string> = {
  'POCO PROBABLE': 'RARO',
  'MUY PROBABLE': 'PROBABLE',
  'INMINENTE': 'FRECUENTE'
};

export const consLegacyMap: Record<string, string> = {
  'LEVE': 'POCO SIGNIFICATIVAS',
  'MODERADA': 'MODERADAS',
  'SIGNIFICATIVA': 'CRITICAS',
  'GRAVE': 'CRITICAS',
  'DESASTROSA': 'DESASTROSAS'
};

export const PROBABILIDAD_TEXTO: Record<string, string> = { 'IMPROBABLE': 'Improbable', 'RARO': 'Raro', 'OCASIONAL': 'Ocasional', 'PROBABLE': 'Probable', 'FRECUENTE': 'Frecuente' };

export const PROBABILIDAD_TR: Record<string, string> = {
    'IMPROBABLE': '500 años ≤ TR',
    'RARO': '50 años < TR ≤ 500 años',
    'OCASIONAL': '5 años < TR ≤ 50 años',
    'PROBABLE': '1 año < TR ≤ 5 años',
    'FRECUENTE': 'TR ≤ 1 año'
};

export const CONSECUENCIA_TEXTO: Record<string, string> = { 'POCO SIGNIFICATIVAS': 'Poco significativas', 'MODERADAS': 'Moderadas', 'CRITICAS': 'Críticas', 'DESASTROSAS': 'Desastrosas' };

export const CONSECUENCIA_DESC: Record<string, string> = {
    'DESASTROSAS': 'Cuando los daños rebasan la capacidad de respuesta del Gobierno del Estado y debe apoyarlo la Federación. Se emite Declaratoria de Desastre.',
    'CRITICAS': 'Cuando los daños no rebasan la capacidad de respuesta del Gobierno del Estado, pero sí la de uno o más Municipios. Se emite Declaratoria de Emergencia.',
    'MODERADAS': 'Cuando los daños pueden ser manejados por el propietario del inmueble y éste se encarga de su reparación.',
    'POCO SIGNIFICATIVAS': 'No hay daño, o éstos son mínimos.'
};

export const TEXTO_NO_APLICA = 'No aplica';

export const TEXTO_SIN_EVALUAR = 'Sin evaluar';

export const uiriRoles = [
    { id: 'presidente', label: 'Presidente' },
    { id: 'secretario_ejecutivo', label: 'Secretario Ejecutivo' },
    { id: 'director', label: 'Director' },
    { id: 'suplente', label: 'Suplente' },
    { id: 'jefe_brigada_pa', label: 'Jefe de Brigada — Primeros Auxilios' },
    { id: 'jefe_brigada_ci', label: 'Jefe de Brigada — Contra Incendios' },
    { id: 'jefe_brigada_br', label: 'Jefe de Brigada — Búsqueda y Rescate' },
    { id: 'jefe_brigada_ev', label: 'Jefe de Brigada — Evacuación de Inmueble' },
];

export const JEFES_BRIGADA = [
    { id: 'jefe_brigada_ci', brigada: 'Incendios' },
    { id: 'jefe_brigada_pa', brigada: 'Primeros Auxilios' },
    { id: 'jefe_brigada_br', brigada: 'Búsqueda y Rescate' },
    { id: 'jefe_brigada_ev', brigada: 'Evacuación' },
];

export const BRIGADA_A_ROL = {
    'Incendios': 'Brigadista de incendios',
    'Primeros Auxilios': 'Brigadista de primeros auxilios',
    'Evacuación': 'Brigadista de evacuación',
    'Búsqueda y Rescate': 'Brigadista de búsqueda y rescate',
    'Comunicación': 'Brigadista de comunicación',
    'HAZMAT': 'Brigadista HAZMAT'
};

export const calendarioData = [
    { actividad: 'Constitución de la unidad interna de protección civil', meses: [] },
    { actividad: 'Capacitación a brigadas de emergencia', meses: [] },
    { actividad: 'Difusión del programa interno de protección civil', meses: [] },
    { actividad: 'Verificación y evaluación de riesgos', meses: [] },
    { actividad: 'Revisión de equipos contra incendio', meses: [] },
    { actividad: 'Capacitación de uso de extintores', meses: [] },
    { actividad: 'Plan de respuesta a emergencias', meses: [] },
    { actividad: 'Simulacros', meses: [] },
    { actividad: 'Revisión de señalización y rutas de evacuación', meses: [] },
    { actividad: 'Actualización del Programa Interno de Protección Civil (PIPC)', meses: [] },
    { actividad: 'Revisión de bitácoras de mantenimiento', meses: [] },
];

export const MANT_PROGRAMAS = {
    edificio: { titulo: 'Programa de mantenimiento a edificio', foto: 'mant-edificio' },
    general: { titulo: 'Programa de mantenimiento general', foto: 'mant-general' }
};

export const ANEXOS_CATALOGO = [
    { id: 'acta_conformacion_uipc', descripcion: 'Acta de Conformación de la UIPC' },
    { id: 'evidencia_servicio_fumigacion', descripcion: 'Evidencia del Servicio de Fumigación' },
    { id: 'inventario_sustancias_quimicas_hds', descripcion: 'Inventario de Sustancias Químicas y Hojas de Datos de Seguridad (HDS)' },
    { id: 'poliza_seguro_responsabilidad_civil', descripcion: 'Póliza de Seguro de Responsabilidad Civil' },
    { id: 'verificacion_mensual_equipos_emergencia', descripcion: 'Registros de Verificación Mensual de Equipos de Atención a Emergencias' },
    { id: 'termografias_puntos_calientes', descripcion: 'Termografías de Puntos Calientes (NOM-002-STPS-2010 ap. 7.5)' },
    { id: 'medicion_sistema_tierras_fisicas', descripcion: 'Medición del Sistema de Tierras Físicas' },
    { id: 'estudio_riesgo_incendio', descripcion: 'Estudio de Riesgo de Incendio (NOM-002-STPS-2010)' },
    { id: 'acreditacion_proveedor_extintores', descripcion: 'Acreditación del Proveedor de Extintores (NOM-154-SCFI-2005)' },
    { id: 'evidencias_simulacros', descripcion: 'Evidencias de Simulacros' },
    { id: 'evidencia_capacitacion', descripcion: 'Evidencia de capacitación (Diplomas, certificado de capacitación, programa)' },
    { id: 'dictamen_linea_tanques_gas', descripcion: 'Dictamen de línea y/o tanques de gas natural y/o LP' },
    { id: 'inspecciones_mantenimiento_equipos_riesgo', descripcion: 'Evidencias de Inspecciones y Mantenimiento de Equipos de Riesgo' },
    { id: 'prueba_gasto_bomba_contra_incendios', descripcion: 'Prueba de Gasto de la Bomba Contra Incendios' },
];

export const BRIGADAS_OPCIONES = [
    'Incendios',
    'Primeros Auxilios',
    'Evacuación',
    'Búsqueda y Rescate',
    'Comunicación',
    'HAZMAT',
];

export const ROL_OPCIONES = [
    'Líder',
    'Brigadista de incendios',
    'Brigadista de primeros auxilios',
    'Brigadista de evacuación',
    'Brigadista de búsqueda y rescate',
    'Brigadista de comunicación',
    'Brigadista HAZMAT',
];

export const VULNERABILIDAD_OPTS = ['— Seleccionar —', 'Embarazo', 'Motriz', 'Visual', 'Auditiva', 'Adulto mayor', 'Crónica', 'Otro'];

export const APOYO_OPTS = ['— Seleccionar —', 'Silla de ruedas', 'Acompañamiento', 'Intérprete', 'Prioridad de evacuación', 'Otros'];

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const BRIG_XLS_COLUMNAS = [
    { key: 'nombre', titulo: 'Nombre completo *', ancho: 34 },
    { key: 'puesto', titulo: 'Puesto', ancho: 24 },
    { key: 'brigada', titulo: 'Brigada *', ancho: 22 },
    { key: 'rol', titulo: 'Rol / Función *', ancho: 34 },
    { key: 'turno', titulo: 'Turno *', ancho: 12 },
    { key: 'telefono', titulo: 'Teléfono (10 dígitos)', ancho: 20 },
    { key: 'ubicacion', titulo: 'Ubicación en instalación', ancho: 30 }
];

export const TEXTO_PREVENCION_EXPLOSIONES_APLICA = 'Las sustancias químicas explosivas se almacenan en un área controlada donde todos los contenedores se encuentran conectados a la red de tierras, así mismo se cuenta con alarma y está prohibido el acceso de joyas, teléfonos celulares y objetos metálicos en general, a fin de evitar que una chispa pueda provocar una posible explosión.';

export const TEXTO_PREVENCION_EXPLOSIONES_NO_APLICA = 'En las instalaciones de la empresa no se almacenan, manejan ni utilizan sustancias químicas explosivas ni materiales con potencial de explosión, por lo que no aplican medidas específicas para la prevención de explosiones. En caso de que en el futuro se incorporen materiales de esta naturaleza, el presente Programa Interno de Protección Civil será actualizado para incluir las medidas de seguridad correspondientes.';

export const TEXTO_NO_PERTENECE_COMITE = 'A la fecha, la empresa no se encuentra adherida a ningún Comité de Ayuda Mutua. Con el fin de fortalecer los mecanismos de respuesta ante emergencias, se recomienda gestionar su integración; para tal fin, se adjunta la carta de compromiso.';

export function getTextoDescripcionInmueble(m2: any): string {
    var m2str = (m2 && m2 > 0) ? Number(m2).toLocaleString('es-MX') : '___,___';
    return "El inmueble es una nave industrial de ".concat(m2str, " m\u00B2 de construcci\u00F3n a base de estructura met\u00E1lica de vigas de acero, con muros perimetrales de concreto y block, as\u00ED como ventilaci\u00F3n natural por medio de lamas abatibles para el ingreso y salida del aire, en el techo l\u00E1mina acanalada con espacios para tragaluz del mismo material.\n\nEn las \u00E1reas administrativas se cuenta con muros perimetrales de block y divisiones interiores de muros falsos con canceler\u00EDa de aluminio y vidrio, cuentan adem\u00E1s con sistema de climatizaci\u00F3n central.\n\nEn la nave se cuenta con salidas de emergencia, y rampas de carga y descarga con cortinas de acero, las instalaciones cuentan con el suministro de energ\u00EDa el\u00E9ctrica y servicios b\u00E1sicos como agua potable y gas natural, as\u00ED mismo la planta est\u00E1 conectada a la red municipal de descarga de aguas.");
}
