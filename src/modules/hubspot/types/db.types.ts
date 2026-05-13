export interface Api_Hubspot {
  id: string;

  n__de_d_n_i: string | null;
  campana_admision: string | null;
  estado_matricula: string | null;
  estado_pagos: string | null;
  estado_postulante: string | null;
  firstname: string | null;
  lastname: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  tipo_de_documento: string | null;
  departamento: string | null;
  provincia_de_procedencia: string | null;
  distrito_de_procedencia: string | null;
  distrito: string | null;
  phone: string | null;
  mobilphone: string | null;
  email: string | null;
  procedencia: string | null;
  distrito_del_colegio: string | null;
  colegio_de_procedencia: string | null;
  ano_de_egreso: string | null;
  modalidad_de_estudio: string | null;
  genero_m__f: string | null;
  carrera_o_especialidad: string | null;
  fecha_de_inicio_academico: string | null;
  turno: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface Api_Hubspot_Consolidado {
  id: string;
  n__de_d_n_i?: string | null;
  campana_admision?: string | null;
  estado_matricula?: string | null;
  estado_pagos?: string | null;
  estado_postulante?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  cantidad: number;
  ids: string;
  createdAt: Date;
  updatedAt: Date;
}
