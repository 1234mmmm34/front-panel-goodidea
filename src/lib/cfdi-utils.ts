export interface ResultadoCfdiXml {
  exito: boolean;
  error?: string;
  noFactura?: string;
  fecha?: string;
  timbrada: boolean;
  total?: number;
  tieneTimbreFiscal: boolean;
}

/**
 * Lee y parsea un archivo XML de CFDI en el navegador.
 * Extrae No. Factura (Serie + Folio), Fecha (YYYY-MM-DD), Total y si cuenta con TimbreFiscalDigital.
 */
export async function leerCfdiXml(archivo: File): Promise<ResultadoCfdiXml> {
  try {
    const texto = await archivo.text();
    if (!texto || !texto.trim()) {
      return {
        exito: false,
        timbrada: false,
        tieneTimbreFiscal: false,
        error: "El archivo XML está vacío.",
      };
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(texto, "application/xml");

    // Verificar si hubo error de parseo XML
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError && parserError.length > 0) {
      return {
        exito: false,
        timbrada: false,
        tieneTimbreFiscal: false,
        error: "El archivo seleccionado no es un XML válido.",
      };
    }

    // Buscar el nodo Comprobante ignorando prefijos de namespace
    let comprobanteNode: Element | null = null;
    const comprobantes = xmlDoc.getElementsByTagNameNS("*", "Comprobante");
    if (comprobantes && comprobantes.length > 0) {
      comprobanteNode = comprobantes[0];
    } else {
      // Fallback a getElementsByTagName normal
      const normalComprobantes = xmlDoc.getElementsByTagName("Comprobante");
      if (normalComprobantes && normalComprobantes.length > 0) {
        comprobanteNode = normalComprobantes[0];
      } else if (xmlDoc.documentElement && xmlDoc.documentElement.localName?.toLowerCase() === "comprobante") {
        comprobanteNode = xmlDoc.documentElement;
      }
    }

    if (!comprobanteNode) {
      return {
        exito: false,
        timbrada: false,
        tieneTimbreFiscal: false,
        error: "El archivo XML no contiene el nodo Comprobante de un CFDI.",
      };
    }

    // Extraer Serie y Folio
    const serie = comprobanteNode.getAttribute("Serie") || comprobanteNode.getAttribute("serie") || "";
    const folio = comprobanteNode.getAttribute("Folio") || comprobanteNode.getAttribute("folio") || "";
    let noFactura = "";
    if (serie && folio) {
      noFactura = `${serie}${folio}`;
    } else if (folio) {
      noFactura = folio;
    } else if (serie) {
      noFactura = serie;
    }

    // Extraer Fecha (YYYY-MM-DD)
    const fechaRaw = comprobanteNode.getAttribute("Fecha") || comprobanteNode.getAttribute("fecha") || "";
    let fecha = "";
    if (fechaRaw) {
      fecha = fechaRaw.split("T")[0];
    }

    // Extraer Total
    const totalRaw = comprobanteNode.getAttribute("Total") || comprobanteNode.getAttribute("total");
    let total: number | undefined = undefined;
    if (totalRaw !== null && totalRaw !== undefined) {
      const parsedTotal = parseFloat(totalRaw);
      if (!isNaN(parsedTotal)) {
        total = parsedTotal;
      }
    }

    // Buscar TimbreFiscalDigital
    let tieneTimbre = false;
    const timbres = xmlDoc.getElementsByTagNameNS("*", "TimbreFiscalDigital");
    if (timbres && timbres.length > 0) {
      tieneTimbre = true;
    } else {
      const normalTimbres = xmlDoc.getElementsByTagName("TimbreFiscalDigital");
      if (normalTimbres && normalTimbres.length > 0) {
        tieneTimbre = true;
      }
    }

    return {
      exito: true,
      noFactura: noFactura.trim() || undefined,
      fecha: fecha || undefined,
      total,
      timbrada: tieneTimbre,
      tieneTimbreFiscal: tieneTimbre,
    };
  } catch (err: any) {
    return {
      exito: false,
      timbrada: false,
      tieneTimbreFiscal: false,
      error: err?.message || "Error al procesar el archivo XML.",
    };
  }
}
