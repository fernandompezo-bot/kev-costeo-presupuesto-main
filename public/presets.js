/**
 * presets.js - Datos maestros, catálogos, presets de proyectos y bases legales
 * KEV Process SpA - Sistema de Presupuestos y Costeo
 */

const KEV_MAESTROS = {
  empresa: {
    razonSocial: "KEV PROCESS SPA",
    rut: "76.220.228-K",
    direccion: "VICTORIA 984, SAN PEDRO DE LA PAZ, CONCEPCIÓN",
    giro: "PROYECTOS Y SERVICIOS AREA ELECTRONICA Y AUTOMATIZACION",
    contacto: "CHRISTIAN BARAHONA",
    movil: "+569 94781983",
    email: "christian.barahona@kevprocess.com",
    ciudad: "Concepción"
  },

  descuentosSiemens: {
    "XG": { nombre: "Variadores Sinamics / Drives", descuento: 0.55 },
    "XD": { nombre: "Aparamenta Sirius / Contactores", descuento: 0.61 },
    "X1": { nombre: "Control y Maniobra BT", descuento: 0.41 },
    "X3": { nombre: "Protecciones / Interruptores", descuento: 0.41 },
    "X4": { nombre: "Accesorios y Fusibles", descuento: 0.44 },
    "ZF": { nombre: "Automatización S7 / HMI", descuento: 0.41 },
    "ZG": { nombre: "Comunicaciones / Redes", descuento: 0.44 },
    "1°": { nombre: "Motores y Accionamientos", descuento: 0.55 },
    "2°": { nombre: "Sistemas Especiales 2", descuento: 0.52 },
    "4°": { nombre: "Instrumentación de Campo", descuento: 0.52 },
    "YC": { nombre: "Repuestos y Licencias", descuento: 0.59 },
    "NETO": { nombre: "Sin Descuento (Costo Neto)", descuento: 0.00 }
  },

  descuentosSiemensOficiales: {
    "XG": { nombre: "Variadores Sinamics / Drives", descuento: 0.55 },
    "XD": { nombre: "Aparamenta Sirius / Contactores", descuento: 0.61 },
    "X1": { nombre: "Control y Maniobra BT", descuento: 0.41 },
    "X3": { nombre: "Protecciones / Interruptores", descuento: 0.41 },
    "X4": { nombre: "Accesorios y Fusibles", descuento: 0.44 },
    "ZF": { nombre: "Automatización S7 / HMI", descuento: 0.41 },
    "ZG": { nombre: "Comunicaciones / Redes", descuento: 0.44 },
    "1°": { nombre: "Motores y Accionamientos", descuento: 0.55 },
    "2°": { nombre: "Sistemas Especiales 2", descuento: 0.52 },
    "4°": { nombre: "Instrumentación de Campo", descuento: 0.52 },
    "YC": { nombre: "Repuestos y Licencias", descuento: 0.59 },
    "NETO": { nombre: "Sin Descuento (Costo Neto)", descuento: 0.00 }
  },

  textosPropuestaEstandar: {
    saludo: 'Por medio de la presente comunicación, envío a usted nuestra propuesta técnico-comercial por el requerimiento de "{titulo}", para las instalaciones de {planta}.',
    requerimiento: 'De acuerdo con lo coordinado con {cliente}, se presenta la oferta técnica y económica para la ejecución del servicio de {titulo}. El proyecto contempla las fases de diseño preliminar, ingeniería de detalle, programación de lógicas de control, suministro de equipos, integración de tableros, pruebas en taller y comisionamiento en faena.',
    metodologia: 'Se contemplan {semanasOficina} semanas de trabajo en oficina para análisis de planimetría, desarrollo de lógicas de control PLC/SCADA y pruebas de validación. Asimismo, se consideran {diasTerreno} días de faena en terreno para levantamiento, marcaje, interconexión eléctrica, carga de software y pruebas de puesta en servicio (PEM).',
    requerimientosPrevios: '• Planimetría unilineal y diagramas de conexionado actualizados del área de intervención.\n• Arquitectura de red y mapas de memoria vigentes de PLC / controladores existentes.\n• Detención programada de equipos y disponibilidad de personal de operación y mantenimiento.\n• Permisos de acceso a faena e inducciones de seguridad aplicables.',
    entregables: '• Protocolos de prueba firmados en terreno.\n• Respaldos completos de software (código fuente PLC/SCADA/Drives).\n• Planos red-line actualizados conforme a la implementación realizada.',
    notasEspeciales: ''
  },

  clientesFrecuentes: [
    { nombre: "AZA", planta: "Planta Colina, Santiago", contacto: "Eduardo / Juan" },
    { nombre: "CMP Romeral", planta: "Faena El Romeral, La Serena", contacto: "Administrador de Contrato" },
    { nombre: "CMP Pellets", planta: "Planta de Pellets, Huasco", contacto: "Jefe de Mantenimiento" },
    { nombre: "CMP Guayacán", planta: "Puerto Guayacán, Coquimbo", contacto: "Superintendente Eléctrico" },
    { nombre: "CMP Los Colorados", planta: "Mina Los Colorados, Vallenar", contacto: "Ingeniería de Planta" },
    { nombre: "CMP Magnetita", planta: "Planta Magnetita, Tierra Amarilla", contacto: "Jefe Automatización" },
    { nombre: "FORSAC (CMPC)", planta: "Planta Chillán / Buin", contacto: "Mauricio" },
    { nombre: "FORSAC México", planta: "Guadalajara, México", contacto: "Operaciones México" },
    { nombre: "CAROZZI", planta: "Planta Nos / San Bernardo", contacto: "Juan / Mauricio" },
    { nombre: "HUACHIPATO (HTO)", planta: "San Vicente, Talcahuano", contacto: "Tierras Raras" },
    { nombre: "RUMASAL", planta: "Concepción", contacto: "Pablo" }
  ],

  catalogoEquiposFrecuentes: [
    { codigo: "6SL3210-1PE33-7AL0", descripcion: "SINAMICS PM240-2 IP20 FSG A 3AC 380-480V 200.00kW", grupo: "XG", listaUSD: 37072.13, unidad: "CU" },
    { codigo: "6SL3244-0BB12-1PA1", descripcion: "SINAMICS CU240E-2 DP Control Unit", grupo: "XG", listaUSD: 954.51, unidad: "CU" },
    { codigo: "6SL3244-0BB12-1FA0", descripcion: "SINAMICS CU240E-2 PN Control Unit (Profinet)", grupo: "XG", listaUSD: 1045.00, unidad: "CU" },
    { codigo: "6SL3255-0AA00-4JA2", descripcion: "Intelligent Operator Panel IOP-2", grupo: "XG", listaUSD: 506.71, unidad: "CU" },
    { codigo: "6SL3256-0AP00-0JA0", descripcion: "Door mounting kit for IOP-2/BOP-2 incl. 5m cable", grupo: "XG", listaUSD: 102.33, unidad: "CU" },
    { codigo: "3NA3260", descripcion: "LV HRC fuse link, NH2 400A AC 500V/ DC 440V", grupo: "XG", listaUSD: 71.47, unidad: "CU" },
    { codigo: "3RT1076-6AP36", descripcion: "CONTACTOR SIRIUS, 250KW/400V/AC-3", grupo: "XD", listaUSD: 7031.00, unidad: "CU" },
    { codigo: "6ES7515-2AM02-0AB0", descripcion: "SIMATIC S7-1500 CPU 1515-2 PN", grupo: "ZF", listaUSD: 3120.00, unidad: "CU" },
    { codigo: "6ES7521-1BL00-0AB0", descripcion: "SIMATIC S7-1500 DI 32x24VDC HF", grupo: "ZF", listaUSD: 580.00, unidad: "CU" },
    { codigo: "6ES7522-1BL01-0AB0", descripcion: "SIMATIC S7-1500 DQ 32x24VDC/0.5A HF", grupo: "ZF", listaUSD: 690.00, unidad: "CU" },
    { codigo: "6GK7443-1EX30-0XE0", descripcion: "Communications processor CP 443-1 Profinet", grupo: "ZG", listaUSD: 3450.00, unidad: "CU" },
    { codigo: "6GK7543-1AX00-0XE0", descripcion: "Communications processor CP 1543-1 S7-1500", grupo: "ZG", listaUSD: 2450.00, unidad: "CU" },
    { codigo: "TAB-AUTO-2000X1200", descripcion: "TABLERO AUTOSOPORTADO METÁLICO 2000X1200X800MM IP55 (INCL. INTEGRACIÓN)", grupo: "NETO", listaUSD: 0, costoCLP: 1634527, unidad: "CU" },
    { codigo: "FUNGIBLES-TABLERO", descripcion: "Fungibles de armado, bornas, canaletas y rotulación", grupo: "NETO", listaUSD: 0, costoCLP: 800000, unidad: "CU" }
  ],

  tarifasHH: {
    "pcs7": { nombre: "HH Ingeniero PCS7", costoUnitario: 25000, unidad: "HH" },
    "scada": { nombre: "HH Ingeniero SCADA", costoUnitario: 20000, unidad: "HH" },
    "plc": { nombre: "HH Ingeniero PLC", costoUnitario: 20000, unidad: "HH" },
    "pem": { nombre: "HH PEM Ingeniero (Puesta en Marcha)", costoUnitario: 20000, unidad: "HH" },
    "integracion": { nombre: "HH Integración Técnico", costoUnitario: 17000, unidad: "HH" },
    "planimetria": { nombre: "HH Planimetría / Dibujo CAD", costoUnitario: 17000, unidad: "HH" },
    "fat": { nombre: "HH Pruebas FAT en Taller", costoUnitario: 17000, unidad: "HH" },
    "asistencia": { nombre: "HH Asistencia Especialista", costoUnitario: 15000, unidad: "HH" }
  },

  tarifasLogisticas: {
    estadia: { item: "7.01", nombre: "Estadía (por noche/persona)", costoUnitario: 100000, unidad: "C/U" },
    alimentacion: { item: "7.02", nombre: "Alimentación (por día/persona)", costoUnitario: 50000, unidad: "C/U" },
    combustible: { item: "7.03", nombre: "Combustible y Peajes", costoUnitario: 20000, unidad: "C/U" },
    arriendoVehiculo: { item: "7.04", nombre: "Arriendo Vehículo / Camioneta 4x4", costoUnitario: 50000, unidad: "C/U" },
    pasajesAvion: { item: "7.05", nombre: "Pasajes Avión (incl. Transfer)", costoUnitario: 250000, unidad: "C/U" },
    epp: { item: "7.06", nombre: "EPP y Equipamiento Faena", costoUnitario: 200000, unidad: "C/U" },
    depto: { item: "7.07", nombre: "Arriendo Departamento / Residencia", costoUnitario: 600000, unidad: "C/U" }
  },

  margenesPorDefecto: {
    ingenieria: 0.55,
    adicionales: 0.30,
    integracion: 0.55,
    equipos: 0.30,
    flete: 0.10,
    montaje: 0.30,
    otros: 0.10
  },

  hitosPagoEstandar: [
    { ep: "EP-1", hito: "Recepción de Equipos y Aprobación de Planimetría", porcentaje: 50 },
    { ep: "EP-2", hito: "Pruebas FAT/CAT de Sistema en Taller", porcentaje: 10 },
    { ep: "EP-3", hito: "Comisionamiento y Puesta en Marcha en Terreno", porcentaje: 30 },
    { ep: "EP-4", hito: "Entrega de Protocolos y Planos As-Built", porcentaje: 10 }
  ],

  exclusionesEstandar: [
    { id: "e1", texto: "No se incluye montaje mecánico o canalizaciones externas no especificadas.", activo: true },
    { id: "e2", texto: "No se contempla integración o comunicación con otros sistemas de terceros no detallados.", activo: true },
    { id: "e3", texto: "Cualquier equipo, licencia o insumo no especificado taxativamente en esta oferta.", activo: true },
    { id: "e4", texto: "No incluye obras civiles, perforaciones mayores ni canalizados subterráneos.", activo: false },
    { id: "e5", texto: "No considera suministro de energía provisional ni grupos generadores.", activo: false },
    { id: "e6", texto: "No contempla traslados ni alojamiento de personal ajeno a KEV Process SpA.", activo: false }
  ],

  basesLegalesGarantia: [
    {
      titulo: "1. Objeto y Cobertura de la Garantía",
      texto: "KEV PROCESS SPA otorga al Cliente garantía por los servicios de ingeniería, programación de lógicas de control, integración y puesta en servicio descritos en la presente oferta. Cubre sin costo la corrección de defectos atribuibles a diseño funcional, programación en PLC/DCS, pantallas HMI/SCADA y parametrización de accionamientos."
    },
    {
      titulo: "2. Vigencia de la Garantía",
      texto: "La garantía técnica tiene una vigencia de 12 meses a contar de la firma del acta de comisionamiento formal y entrega de documentación conforme."
    },
    {
      titulo: "3. Exclusiones Contractuales",
      texto: "No cubre: a) Fallas por uso indebido u operación fuera de especificaciones técnicas; b) Problemas originados en componentes o software de terceros, cuya garantía se rige estrictamente por la del fabricante oficial; c) Daños provocados por perturbaciones en la red eléctrica (armónicos, sobretensiones) o condiciones ambientales no especificadas; d) Alteraciones en ciberseguridad, parches TI o virus sin coordinación previa; e) Modificaciones al código o reingeniería ejecutada por personal ajeno a KEV PROCESS SPA."
    },
    {
      titulo: "4. Requisitos Previos y Obligaciones del Cliente",
      texto: "El Cliente deberá proporcionar acceso a instalaciones, respaldos actualizados de sistemas existentes, planimetría unilineal válida, energía estabilizada y las detenciones operativas requeridas para las pruebas en terreno."
    },
    {
      titulo: "5. Niveles de Servicio (SLA) y Soporte",
      texto: "Soporte técnico remoto con respuesta dentro de las primeras 4 horas para incidentes críticos y visitas en terreno coordinadas según disponibilidad y condiciones de faena."
    },
    {
      titulo: "6. Límite de Responsabilidad y Propiedad Intelectual",
      texto: "La responsabilidad total de KEV PROCESS SPA ante cualquier eventualidad se limita estrictamente al valor neto percibido por el servicio prestado, excluyendo expresamente lucro cesante, pérdidas de producción o daños indirectos. Toda la programación y planos red-line generados pasan a ser de propiedad del Cliente al momento del pago total de la oferta."
    },
    {
      titulo: "7. Ley Aplicable y Jurisdicción",
      texto: "Para todos los efectos legales, la presente oferta y eventual contrato se rigen por las leyes de la República de Chile, fijando domicilio en la ciudad de Concepción."
    }
  ]
};

// Presets de Proyectos reales 2026
const PRESETS_PROYECTOS = {
  "101-2026": {
    nombre: "Migración Arrancador Suave Sirius a Sinamics G120 (Caso Base 101-2026)",
    tipo: "integral",
    cliente: "AZA",
    planta: "Planta Colina, Santiago",
    correlativo: "101-2026",
    titulo: "Migración Arrancador Suave Sirius a Sinamics G120",
    dolar: 950,
    uf: 40800,
    semanasOficina: 2,
    diasTerreno: 4,
    ingenieria: [
      { id: "1.4", perfil: "HH Ingeniero PLC", hh: 90, costoUnitario: 20000, comentario: "2 Semanas programación PLC+SCADA" },
      { id: "1.5", perfil: "HH PEM Ingeniero", hh: 36, costoUnitario: 20000, comentario: "4 días en terreno" },
      { id: "1.7", perfil: "HH Integración Técnico", hh: 36, costoUnitario: 17000, comentario: "4 días integración" },
      { id: "1.8", perfil: "HH Planimetría", hh: 27, costoUnitario: 17000, comentario: "3 días planimetría" },
      { id: "1.9", perfil: "HH FAT", hh: 9, costoUnitario: 17000, comentario: "1 día FAT" }
    ],
    integracionElectrica: [
      { id: "3.01", descripcion: "Integración tablero y pruebas de taller", unidad: "HH", cantidad: 72, costoUnitario: 17000 }
    ],
    equipos: [
      { item: "4.01", codigo: "6SL3210-1PE33-7AL0", descripcion: "SINAMICS PM240-2 IP20 FSG A 3AC 380-480V 200.00kW", grupo: "XG", listaUSD: 37072.13, unidad: "CU", cantidad: 1 },
      { item: "4.02", codigo: "6SL3244-0BB12-1PA1", descripcion: "SINAMICS CU240E-2 DP", grupo: "XG", listaUSD: 954.51, unidad: "CU", cantidad: 1 },
      { item: "4.03", codigo: "6SL3255-0AA00-4JA2", descripcion: "Intelligent Operator Panel IOP-2", grupo: "XG", listaUSD: 506.71, unidad: "CU", cantidad: 1 },
      { item: "4.04", codigo: "6SL3256-0AP00-0JA0", descripcion: "Door mounting kit for IOP-2/BOP-2 incl. 5m connecting cable", grupo: "XG", listaUSD: 102.33, unidad: "CU", cantidad: 1 },
      { item: "4.05", codigo: "3NA3260", descripcion: "LV HRC fuse link, NH2 400A AC 500V/ DC 440V", grupo: "XG", listaUSD: 71.47, unidad: "CU", cantidad: 3 },
      { item: "4.06", codigo: "3RT1076-6AP36", descripcion: "CONTACTOR, 250KW/400V/AC-3", grupo: "XD", listaUSD: 7031.00, unidad: "CU", cantidad: 1 },
      { item: "4.07", codigo: "TAB-AUTO-2000X1200", descripcion: "TABLERO AUTOSOPORTADO METÁLICO 2000X1200X800MM IP55 (INCL. INTEGRACIÓN)", grupo: "NETO", listaUSD: 0, costoCLP: 1634527, unidad: "CU", cantidad: 1 },
      { item: "4.08", codigo: "FUNGIBLES", descripcion: "Fungibles de conexionado y montaje", grupo: "NETO", listaUSD: 0, costoCLP: 800000, unidad: "CU", cantidad: 1 }
    ],
    flete: [
      { item: "5.01", descripcion: "Flete especializado de gabinete y equipos a faena", unidad: "C/U", cantidad: 1, costoUnitario: 400000 }
    ],
    montaje: [],
    otros: [
      { item: "7.01", descripcion: "Estadía", unidad: "C/U", cantidad: 4, costoUnitario: 100000 },
      { item: "7.02", descripcion: "Alimentación", unidad: "C/U", cantidad: 4, costoUnitario: 50000 },
      { item: "7.03", descripcion: "Combustible y peajes", unidad: "C/U", cantidad: 4, costoUnitario: 20000 },
      { item: "7.04", descripcion: "Arriendo vehículo", unidad: "C/U", cantidad: 4, costoUnitario: 50000 },
      { item: "7.05", descripcion: "Pasajes Avión (incl. Transfer)", unidad: "C/U", cantidad: 1, costoUnitario: 250000 }
    ],
    margenes: {
      ingenieria: 0.55,
      adicionales: 0.30,
      integracion: 0.55,
      equipos: 0.30,
      flete: 0.10,
      montaje: 0.30,
      otros: 0.10
    }
  },

  "061-2026": {
    nombre: "Servicio Asistencia Terreno / PEM / Soporte PCS7 (Caso 061-2026)",
    tipo: "servicio",
    cliente: "CMP Totoralillo",
    planta: "Copiapó",
    correlativo: "061-2026",
    titulo: "Servicio PCS7 Integración Espesador Totoralillo",
    dolar: 950,
    uf: 40800,
    semanasOficina: 3,
    diasTerreno: 12,
    ingenieria: [
      { id: "1.1", perfil: "HH Ingeniero PCS7", hh: 360, costoUnitario: 25000, comentario: "Programación PCS7 y lógicas" },
      { id: "1.5", perfil: "HH PEM Ingeniero", hh: 120, costoUnitario: 20000, comentario: "Comisionamiento en faena" },
      { id: "1.9", perfil: "HH FAT", hh: 40, costoUnitario: 17000, comentario: "Pruebas virtuales y FAT" }
    ],
    integracionElectrica: [],
    equipos: [],
    flete: [],
    montaje: [],
    otros: [
      { item: "7.01", descripcion: "Estadía hotel especialista", unidad: "C/U", cantidad: 12, costoUnitario: 100000 },
      { item: "7.02", descripcion: "Alimentación diaria", unidad: "C/U", cantidad: 12, costoUnitario: 50000 },
      { item: "7.03", descripcion: "Combustible faena", unidad: "C/U", cantidad: 12, costoUnitario: 20000 },
      { item: "7.04", descripcion: "Camioneta equipada minería", unidad: "C/U", cantidad: 12, costoUnitario: 65000 },
      { item: "7.05", descripcion: "Vuelos Santiago-Copiapó", unidad: "C/U", cantidad: 3, costoUnitario: 280000 }
    ],
    margenes: {
      ingenieria: 0.45,
      adicionales: 0.30,
      integracion: 0.55,
      equipos: 0.30,
      flete: 0.10,
      montaje: 0.30,
      otros: 0.10
    }
  },

  "037-2026": {
    nombre: "Suministro de Hardware y Repuestos (Caso 037-2026)",
    tipo: "suministro",
    cliente: "FORSAC (CMPC)",
    planta: "Chillán",
    correlativo: "037-2026",
    titulo: "Suministro SIMATIC IPC MD-57A y Licencias",
    dolar: 950,
    uf: 40800,
    semanasOficina: 0,
    diasTerreno: 0,
    ingenieria: [],
    integracionElectrica: [],
    equipos: [
      { item: "4.01", codigo: "6AV7882-0AA00-0AA0", descripcion: "SIMATIC IPC MD-57A Core i7, 32GB RAM, 512GB SSD", grupo: "ZF", listaUSD: 11500.00, unidad: "CU", cantidad: 1 },
      { item: "4.02", codigo: "6AV2102-0AA08-0AA0", descripcion: "WinCC Runtime Advanced V18 2048 PowerTags", grupo: "YC", listaUSD: 2350.00, unidad: "CU", cantidad: 1 }
    ],
    flete: [
      { item: "5.01", descripcion: "Flete aéreo internacional y entrega express", unidad: "C/U", cantidad: 1, costoUnitario: 250000 }
    ],
    montaje: [],
    otros: [],
    margenes: {
      ingenieria: 0.55,
      adicionales: 0.30,
      integracion: 0.55,
      equipos: 0.35,
      flete: 0.10,
      montaje: 0.30,
      otros: 0.10
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KEV_MAESTROS, PRESETS_PROYECTOS };
}
