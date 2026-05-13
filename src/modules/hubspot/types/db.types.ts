export interface Api_Hubspot {
  id: string;
  n__de_d_n_i?: string | null;
  campana_admision?: string | null;
  estado_matricula?: string | null;
  estado_pagos?: string | null;
  estado_postulante?: string | null;
  firstname?: string | null;
  lastname?: string | null;
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
