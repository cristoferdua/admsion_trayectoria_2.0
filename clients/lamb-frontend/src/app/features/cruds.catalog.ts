export type FieldType = 'text' | 'number' | 'decimal' | 'date' | 'datetime' | 'enum' | 'boolean' | 'textarea' | 'id' | 'reniec';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];     // para enum
  listed?: boolean;       // se muestra en la tabla
  editable?: boolean;     // se puede editar en el formulario (false para campos calculados)
  default?: any;
}

export interface CrudDef {
  slug: string;
  label: string;
  icon: string;
  path: string;
  group: 'Admisión' | 'Trayectoria';
  description: string;
  fields: FieldDef[];
}

// Helper
const f = (key: string, label: string, type: FieldType, opts: Partial<FieldDef> = {}): FieldDef =>
  ({ key, label, type, listed: true, editable: true, ...opts });

export const CRUDS: CrudDef[] = [
  // ============ ADMISIÓN (8) ============
  {
    group: 'Admisión', slug: 'convocatorias', label: 'Convocatoria y oferta',
    icon: 'campaign', path: '/api/v1/convocatorias',
    description: 'Proceso de admisión, modalidad, vacantes y cronograma del periodo',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('codigo', 'Código', 'text', { required: true }),
      f('nombre', 'Nombre', 'text', { required: true }),
      f('periodo', 'Periodo', 'text', { required: true, default: '2026-2' }),
      f('fechaInicio', 'Inicio', 'date', { required: true }),
      f('fechaFin', 'Fin', 'date', { required: true }),
      f('fechaExamen', 'Fecha examen', 'date'),
      f('vacantesTotales', 'Vacantes', 'number', { required: true, default: 0 }),
      f('estado', 'Estado', 'enum', { required: true, options: ['PLANIFICADA','ABIERTA','CERRADA','ANULADA'], default: 'PLANIFICADA' }),
      f('observacion', 'Observación', 'textarea', { listed: false })
    ]
  },
  {
    group: 'Admisión', slug: 'postulantes', label: 'Postulante',
    icon: 'person', path: '/api/v1/postulantes',
    description: 'Datos del postulante, apoderado y colegio de procedencia',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('__reniec', 'Buscar por DNI (RENIEC)', 'reniec', { listed: false }),
      f('idPersona', 'ID Persona', 'number', { required: true }),
      f('idConvocatoria', 'ID Convocatoria', 'number', { required: true }),
      f('idPrograma', 'ID Programa', 'number', { required: true }),
      f('idModalidad', 'ID Modalidad', 'number', { required: true }),
      // Código autogenerado por backend: POS-{periodo}-{correlativo}. No se edita.
      f('codigoPostulante', 'Código', 'text', { editable: false }),
      f('colegioProcedencia', 'Colegio', 'text'),
      f('anioEgresoColegio', 'Año egreso', 'number'),
      f('promedioColegio', 'Promedio', 'decimal'),
      f('telefonoContacto', 'Teléfono', 'text'),
      f('correoContacto', 'Correo', 'text'),
      f('nombreApoderado', 'Apoderado', 'text'),
      f('telefonoApoderado', 'Tel. apoderado', 'text', { listed: false }),
      f('estado', 'Estado', 'enum', { required: true, options: ['REGISTRADO','INSCRITO','EVALUADO','ADMITIDO','RECHAZADO','DESISTIDO'], default: 'REGISTRADO' })
    ]
  },
  {
    group: 'Admisión', slug: 'inscripciones', label: 'Inscripción',
    icon: 'how_to_reg', path: '/api/v1/inscripciones',
    description: 'Solicitud de admisión con sus documentos presentados',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idPersona', 'ID Persona', 'number', { required: true }),
      f('idPrograma', 'ID Programa', 'number', { required: true }),
      f('idModalidad', 'ID Modalidad', 'number', { required: true }),
      f('periodo', 'Periodo', 'text', { required: true, default: '2026-2' }),
      f('estado', 'Estado', 'enum', { required: true, options: ['PENDIENTE','OBSERVADA','APROBADA','RECHAZADA'], default: 'PENDIENTE' }),
      f('observacion', 'Observación', 'textarea', { listed: false })
    ]
  },
  {
    group: 'Admisión', slug: 'examenes-admision', label: 'Examen de admisión',
    icon: 'quiz', path: '/api/v1/examenes-admision',
    description: 'Examen, aula asignada, aforo y estado',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idConvocatoria', 'ID Convocatoria', 'number', { required: true }),
      f('codigo', 'Código', 'text', { required: true }),
      f('nombre', 'Nombre', 'text', { required: true }),
      f('fechaExamen', 'Fecha', 'datetime', { required: true }),
      f('duracionMinutos', 'Duración (min)', 'number', { required: true, default: 120 }),
      f('idAula', 'ID Aula', 'number'),
      f('aforoMaximo', 'Aforo máx.', 'number', { required: true, default: 30 }),
      f('aforoAsignado', 'Aforo asignado', 'number', { required: true, default: 0 }),
      f('estado', 'Estado', 'enum', { required: true, options: ['PROGRAMADO','EN_CURSO','FINALIZADO','CANCELADO'], default: 'PROGRAMADO' })
    ]
  },
  {
    group: 'Admisión', slug: 'seguimientos', label: 'Seguimiento y cierre',
    icon: 'timeline', path: '/api/v1/seguimientos',
    description: 'Contactos, medios de captación y reclamos',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idPostulante', 'ID Postulante', 'number', { required: true }),
      f('canal', 'Canal', 'enum', { required: true, options: ['LLAMADA','WHATSAPP','CORREO','PRESENCIAL'], default: 'LLAMADA' }),
      f('medioCaptacion', 'Medio captación', 'text'),
      f('asunto', 'Asunto', 'text', { required: true }),
      f('detalle', 'Detalle', 'textarea', { listed: false }),
      f('resultado', 'Resultado', 'enum', { required: true, options: ['CONTACTADO','SIN_RESPUESTA','INTERESADO','DESCARTADO'], default: 'CONTACTADO' }),
      f('idResponsable', 'ID Responsable', 'number'),
      f('fechaContacto', 'Fecha contacto', 'datetime', { required: true }),
      f('proximoContacto', 'Próximo contacto', 'datetime', { listed: false })
    ]
  },
  {
    group: 'Admisión', slug: 'calificaciones', label: 'Examen y calificación',
    icon: 'grade', path: '/api/v1/calificaciones',
    description: 'Puntajes del examen, supervisor y encargado',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idExamen', 'ID Examen', 'number', { required: true }),
      f('idPostulante', 'ID Postulante', 'number', { required: true }),
      f('puntajeTotal', 'Puntaje total', 'decimal', { required: true }),
      f('puntajeAptitud', 'Aptitud', 'decimal'),
      f('puntajeConocimiento', 'Conocimiento', 'decimal'),
      f('respuestasCorrectas', 'Correctas', 'number'),
      f('respuestasIncorrectas', 'Incorrectas', 'number'),
      f('respuestasBlanco', 'Blanco', 'number', { listed: false }),
      f('ordenMerito', 'Orden mérito', 'number'),
      f('idSupervisor', 'ID Supervisor', 'number'),
      f('idEncargado', 'ID Encargado', 'number'),
      f('observacion', 'Observación', 'textarea', { listed: false })
    ]
  },
  {
    group: 'Admisión', slug: 'adjudicaciones', label: 'Vacantes e ingreso',
    icon: 'verified', path: '/api/v1/adjudicaciones',
    description: 'Adjudicación de vacantes y lista de ingresantes',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idPostulante', 'ID Postulante', 'number', { required: true }),
      f('idModalidad', 'ID Modalidad', 'number', { required: true }),
      f('idPrograma', 'ID Programa', 'number', { required: true }),
      f('puntajeFinal', 'Puntaje final', 'decimal', { required: true }),
      f('ordenMerito', 'Orden mérito', 'number'),
      f('estado', 'Estado', 'enum', { required: true, options: ['PENDIENTE','ADJUDICADA','PUBLICADA','ANULADA'], default: 'PENDIENTE' }),
      f('numeroResolucion', 'N° Resolución', 'text'),
      f('fechaPublicacion', 'Publicación', 'datetime', { listed: false }),
      f('observacion', 'Observación', 'textarea', { listed: false })
    ]
  },
  {
    group: 'Admisión', slug: 'casos-especiales', label: 'Casos especiales',
    icon: 'warning', path: '/api/v1/casos-especiales',
    description: 'Ficha socioeconómica, discapacidad, prórrogas, convalidación, anulación',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idPostulante', 'ID Postulante', 'number', { required: true }),
      f('tipoCaso', 'Tipo', 'enum', { required: true, options: ['FICHA_SOCIOECONOMICA','DISCAPACIDAD','PRORROGA_EXAMEN','CONVALIDACION_TRASLADO','ANULACION_INSCRIPCION','CARGA_MASIVA','RECLAMO_APELACION'], default: 'FICHA_SOCIOECONOMICA' }),
      f('descripcion', 'Descripción', 'textarea', { required: true }),
      f('requiereAjuste', 'Requiere ajuste', 'boolean', { required: true, default: false }),
      f('ajusteOtorgado', 'Ajuste otorgado', 'textarea', { listed: false }),
      f('nivelSocioeconomico', 'Nivel socioec.', 'enum', { options: ['A','B','C','D','E'], listed: false }),
      f('idResponsable', 'ID Responsable', 'number'),
      f('estado', 'Estado', 'enum', { required: true, options: ['ABIERTO','EN_REVISION','RESUELTO','RECHAZADO'], default: 'ABIERTO' })
    ]
  },

  // ============ TRAYECTORIA (6) ============
  {
    group: 'Trayectoria', slug: 'trayectorias', label: 'Estudiante en el plan',
    icon: 'route', path: '/api/v1/trayectorias',
    description: 'Estado académico, cambios de plan, traslados internos y reincorporaciones',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idPersona', 'ID Persona', 'number', { required: true }),
      f('idPrograma', 'ID Programa', 'number', { required: true }),
      f('idPostulacion', 'ID Postulación', 'number', { required: true }),
      f('idPlan', 'ID Plan', 'number'),
      f('idEscuela', 'ID Escuela', 'number', { listed: false }),
      f('idSede', 'ID Sede', 'number', { listed: false }),
      f('periodoIngreso', 'Periodo ingreso', 'text', { required: true, default: '2026-2' }),
      f('estado', 'Estado', 'enum', { required: true, options: ['ACTIVO','RESERVA','RETIRADO','SEPARADO','EGRESADO','REINCORPORADO'], default: 'ACTIVO' }),
      f('creditosTotalesPlan', 'Cr. plan', 'number', { listed: false }),
      f('creditosAprobados', 'Cr. aprob.', 'number', { required: true, default: 0 }),
      f('promedioPonderado', 'Promedio', 'decimal')
    ]
  },
  {
    group: 'Trayectoria', slug: 'cumplimientos-requisito', label: 'Avance y requisitos',
    icon: 'checklist', path: '/api/v1/cumplimientos-requisito',
    description: 'Convalidaciones, cumplimiento de requisitos de egreso, formación integral y prácticas',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idTrayectoria', 'ID Trayectoria', 'number', { required: true }),
      f('idPersona', 'ID Persona', 'number', { required: true }),
      f('tipoRequisito', 'Tipo', 'enum', { required: true, options: ['REQUISITO_EGRESO','IDIOMA','PRACTICAS','INVESTIGACION','EXTRACURRICULAR','FORMACION_INTEGRAL','CONVALIDACION'], default: 'REQUISITO_EGRESO' }),
      f('idRequisitoExterno', 'ID Req. externo', 'number'),
      f('codigoExterno', 'Código', 'text'),
      f('descripcion', 'Descripción', 'textarea', { listed: false }),
      f('cumplido', 'Cumplido', 'boolean', { required: true, default: false }),
      f('valorCumplimiento', 'Valor', 'text', { listed: false }),
      f('creditosReconocidos', 'Cr. reconocidos', 'number'),
      f('fechaCumplimiento', 'Fecha', 'date'),
      f('evidenciaUrl', 'Evidencia', 'text', { listed: false })
    ]
  },
  {
    group: 'Trayectoria', slug: 'alertas-riesgo', label: 'Riesgo académico',
    icon: 'warning', path: '/api/v1/alertas-riesgo',
    description: 'Alertas, planes de refuerzo, reglas, niveles, casos de seguimiento y control de repitencia',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idTrayectoria', 'ID Trayectoria', 'number', { required: true }),
      f('idPersona', 'ID Persona', 'number', { required: true }),
      f('nivelRiesgo', 'Nivel', 'enum', { required: true, options: ['BAJO','MEDIO','ALTO','CRITICO'], default: 'MEDIO' }),
      f('tipoAlerta', 'Tipo', 'enum', { required: true, options: ['PROMEDIO_BAJO','REPITENCIA','INASISTENCIA','ABANDONO','DESEMPENIO','OTRO'], default: 'PROMEDIO_BAJO' }),
      f('descripcion', 'Descripción', 'textarea', { required: true }),
      f('valorDetectado', 'Valor', 'decimal'),
      f('umbralRegla', 'Umbral', 'decimal', { listed: false }),
      f('numeroRepitencia', 'N° repitencia', 'number', { listed: false }),
      f('codigoCurso', 'Curso', 'text'),
      f('estado', 'Estado', 'enum', { required: true, options: ['ACTIVA','EN_INTERVENCION','CERRADA','DESCARTADA'], default: 'ACTIVA' }),
      f('fechaDeteccion', 'Detectada', 'datetime', { required: true })
    ]
  },
  {
    group: 'Trayectoria', slug: 'tutorias', label: 'Tutoría y bienestar',
    icon: 'school', path: '/api/v1/tutorias',
    description: 'Programa de tutoría, asignación de tutor, sesiones, observaciones y derivación a bienestar',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idTrayectoria', 'ID Trayectoria', 'number', { required: true }),
      f('idPersona', 'ID Persona', 'number', { required: true }),
      f('idTutor', 'ID Tutor', 'number', { required: true }),
      f('idProgramaTutoria', 'ID Programa', 'number'),
      f('programaTutoria', 'Programa', 'text'),
      f('periodo', 'Periodo', 'text', { required: true, default: '2026-2' }),
      f('estado', 'Estado', 'enum', { required: true, options: ['ACTIVA','CERRADA','DERIVADA_BIENESTAR'], default: 'ACTIVA' }),
      f('fechaInicio', 'Inicio', 'date', { required: true }),
      f('fechaFin', 'Fin', 'date', { listed: false })
    ]
  },
  {
    group: 'Trayectoria', slug: 'reconocimientos', label: 'Logros y evidencias',
    icon: 'military_tech', path: '/api/v1/reconocimientos',
    description: 'Reconocimientos (tercio superior, beca de excelencia, mención) y portafolio de competencias',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idTrayectoria', 'ID Trayectoria', 'number', { required: true }),
      f('idPersona', 'ID Persona', 'number', { required: true }),
      f('tipoReconocimiento', 'Tipo', 'enum', { required: true, options: ['TERCIO_SUPERIOR','BECA_EXCELENCIA','MENCION_HONROSA','PORTAFOLIO','COMPETENCIA','OTRO'], default: 'TERCIO_SUPERIOR' }),
      f('descripcion', 'Descripción', 'textarea', { required: true }),
      f('periodo', 'Periodo', 'text'),
      f('idCompetencia', 'ID Competencia', 'number', { listed: false }),
      f('autoevaluacion', 'Autoevaluación', 'textarea', { listed: false }),
      f('evidenciaUrl', 'Evidencia', 'text', { listed: false })
    ]
  },
  {
    group: 'Trayectoria', slug: 'egresos', label: 'Cierre y egreso',
    icon: 'workspace_premium', path: '/api/v1/egresos',
    description: 'Egreso con verificación de requisitos, solicitud de constancia, situación al cierre e informe',
    fields: [
      f('id', 'ID', 'id', { editable: false }),
      f('idTrayectoria', 'ID Trayectoria', 'number', { required: true }),
      f('idPersona', 'ID Persona', 'number', { required: true }),
      f('periodoEgreso', 'Periodo', 'text', { required: true, default: '2026-2' }),
      f('fechaEgreso', 'Fecha egreso', 'date', { required: true }),
      f('creditosTotales', 'Cr. totales', 'number', { required: true, default: 0 }),
      f('promedioFinal', 'Promedio final', 'decimal'),
      f('todosRequisitosCumplidos', 'Req. OK', 'boolean', { required: true, default: false }),
      f('numeroResolucion', 'N° Resolución', 'text'),
      f('observacion', 'Observación', 'textarea', { listed: false })
    ]
  }
];

export const CRUD_BY_SLUG = new Map(CRUDS.map(c => [c.slug, c]));
