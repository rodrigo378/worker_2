import { HubspotHttpClient } from "./http";
import { HubspotRepository } from "./repository";
import { Api_Hubspot, Api_Hubspot_Consolidado } from "./types/db.types";

// ===================================================================================
export class HubspotService {
  // ===================================================================================
  constructor(
    private readonly http: HubspotHttpClient,
    private readonly repo: HubspotRepository,
  ) {}

  // ===================================================================================
  async sincronizarContactos() {
    let after: string | undefined;
    let totalInsertados = 0;
    const BUFFER_SIZE = 1000;
    let buffer: Api_Hubspot[] = [];

    do {
      const response = await this.http.getContactos(after);

      const responseContactos: Api_Hubspot[] = response.results.map(
        (c: any) => ({
          id: c.id,

          n__de_d_n_i: c.properties.n__de_d_n_i ?? null,
          campana_admision: c.properties.campana_admision ?? null,
          estado_matricula: c.properties.estado_matricula ?? null,
          estado_pagos: c.properties.estado_pagos ?? null,
          estado_postulante: c.properties.estado_postulante ?? null,
          firstname: c.properties.firstname ?? null,
          lastname: c.properties.lastname ?? null,

          apellido_paterno: c.properties.apellido_paterno ?? null,
          apellido_materno: c.properties.apellido_materno ?? null,
          tipo_de_documento: c.properties.tipo_de_documento ?? null,
          departamento: c.properties.departamento ?? null,
          provincia_de_procedencia:
            c.properties.provincia_de_procedencia ?? null,
          distrito_de_procedencia: c.properties.distrito_de_procedencia ?? null,
          distrito: c.properties.distrito ?? null,
          phone: c.properties.phone ?? null,
          mobilphone: c.properties.mobilphone ?? null,
          email: c.properties.email ?? null,
          procedencia: c.properties.procedencia ?? null,
          distrito_del_colegio: c.properties.distrito_del_colegio ?? null,
          colegio_de_procedencia: c.properties.colegio_de_procedencia ?? null,
          ano_de_egreso: c.properties.ano_de_egreso ?? null,
          modalidad_de_estudio: c.properties.modalidad_de_estudio ?? null,
          genero_m__f: c.properties.genero_m__f ?? null,
          carrera_o_especialidad: c.properties.carrera_o_especialidad ?? null,
          fecha_de_inicio_academico:
            c.properties.fecha_de_inicio_academico ?? null,
          turno: c.properties.turno ?? null,

          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }),
      );

      buffer.push(...responseContactos);
      after = response.paging?.next?.after;

      if (buffer.length >= BUFFER_SIZE) {
        await this.repo.upsertManyHubspot(buffer);
        totalInsertados += buffer.length;
        buffer = [];
      }
    } while (after);

    if (buffer.length > 0) {
      await this.repo.upsertManyHubspot(buffer);
      totalInsertados += buffer.length;
    }

    return totalInsertados;
  }

  // ===================================================================================
  async sincronizarConsolidado() {
    const contactos = await this.repo.getContactos();

    const arrayContactos: Api_Hubspot_Consolidado[] = [];

    const seen = new Set<string>();

    const contactosUnicos = contactos.filter((c) => {
      if (!c.n__de_d_n_i) return false;

      const key = `${c.n__de_d_n_i}-${c.campana_admision}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    contactosUnicos.map((cu) => {
      const contac = contactos.filter(
        (c) =>
          c.n__de_d_n_i &&
          c.campana_admision === cu.campana_admision &&
          c.n__de_d_n_i === cu.n__de_d_n_i,
      );
      arrayContactos.push({
        id: contac[0]?.id || "",
        n__de_d_n_i: contac[0]?.n__de_d_n_i || "",
        campana_admision: contac[0]?.campana_admision || "",
        estado_matricula: contac[0]?.estado_matricula || "",
        estado_pagos: contac[0]?.estado_pagos || "",
        estado_postulante: contac[0]?.estado_postulante || "",
        firstname: contac[0]?.firstname || "",
        lastname: contac[0]?.lastname || "",

        apellido_paterno: contac[0]?.apellido_paterno || "",
        apellido_materno: contac[0]?.apellido_materno || "",
        tipo_de_documento: contac[0]?.tipo_de_documento || "",
        departamento: contac[0]?.departamento || "",
        provincia_de_procedencia: contac[0]?.provincia_de_procedencia || "",
        distrito_de_procedencia: contac[0]?.distrito_de_procedencia || "",
        distrito: contac[0]?.distrito || "",
        phone: contac[0]?.phone || "",
        mobilphone: contac[0]?.mobilphone || "",
        email: contac[0]?.email || "",
        procedencia: contac[0]?.procedencia || "",
        distrito_del_colegio: contac[0]?.distrito_del_colegio || "",
        colegio_de_procedencia: contac[0]?.colegio_de_procedencia || "",
        ano_de_egreso: contac[0]?.ano_de_egreso || "",
        modalidad_de_estudio: contac[0]?.modalidad_de_estudio || "",
        genero_m__f: contac[0]?.genero_m__f || "",
        carrera_o_especialidad: contac[0]?.carrera_o_especialidad || "",
        fecha_de_inicio_academico: contac[0]?.fecha_de_inicio_academico || "",
        turno: contac[0]?.turno || "",

        cantidad: contac.length,
        ids: contac.map((c) => c.id).join(","),
        createdAt: contac[0]?.createdAt
          ? new Date(contac[0].createdAt)
          : new Date(),
        updatedAt: contac[0]?.updatedAt
          ? new Date(contac[0].updatedAt)
          : new Date(),
      });
    });

    this.repo.upsertManyHubspotConsolidado(arrayContactos);

    return true;
  }
}
