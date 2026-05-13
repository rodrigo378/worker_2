import { Knex } from "knex";
import { DbName } from "../../core/const/db.const";
import { DbRegistry } from "../../core/db/registry";
import { Api_Hubspot, Api_Hubspot_Consolidado } from "./types/db.types";
import { merge } from "zod/v4/core/util.cjs";

// ===================================================================================
export class HubspotRepository {
  // ===================================================================================
  constructor(private readonly registry: DbRegistry) {}

  // ===================================================================================
  private db(dbName: DbName): Knex {
    return this.registry.get(dbName);
  }

  // ===================================================================================
  async upsertManyHubspot(data: Api_Hubspot[]) {
    if (!data.length) return true;

    const db = this.db("API_2");
    const BATCH_SIZE = 500; // 500 registros por insert

    const toMysqlDate = (date: any) =>
      date ? new Date(date).toISOString().slice(0, 19).replace("T", " ") : null;

    const rows = data.map((d) => ({
      id: d.id,

      n__de_d_n_i: d.n__de_d_n_i ?? null,
      campana_admision: d.campana_admision ?? null,
      estado_matricula: d.estado_matricula ?? null,
      estado_pagos: d.estado_pagos ?? null,
      estado_postulante: d.estado_postulante ?? null,
      firstname: d.firstname ?? null,
      lastname: d.lastname ?? null,

      apellido_paterno: d.apellido_paterno ?? null,
      apellido_materno: d.apellido_materno ?? null,
      tipo_de_documento: d.tipo_de_documento ?? null,
      departamento: d.departamento ?? null,
      provincia_de_procedencia: d.provincia_de_procedencia ?? null,
      distrito_de_procedencia: d.distrito_de_procedencia ?? null,
      distrito: d.distrito ?? null,
      phone: d.phone ?? null,
      mobilphone: d.mobilphone ?? null,
      email: d.email ?? null,
      procedencia: d.procedencia ?? null,
      distrito_del_colegio: d.distrito_del_colegio ?? null,
      colegio_de_procedencia: d.colegio_de_procedencia ?? null,
      ano_de_egreso: d.ano_de_egreso ?? null,
      modalidad_de_estudio: d.modalidad_de_estudio ?? null,
      genero_m__f: d.genero_m__f ?? null,
      carrera_o_especialidad: d.carrera_o_especialidad ?? null,
      fecha_de_inicio_academico: d.fecha_de_inicio_academico ?? null,
      turno: d.turno ?? null,

      createdAt: toMysqlDate(d.createdAt) ?? toMysqlDate(new Date()),
      updatedAt: toMysqlDate(d.updatedAt) ?? toMysqlDate(new Date()),
    }));

    // Divide en chunks de 500
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);

      console.log(
        `insertando batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(rows.length / BATCH_SIZE)} | registros ${i + 1} - ${Math.min(i + BATCH_SIZE, rows.length)}`,
      );

      await db("api_hubspot")
        .insert(chunk)
        .onConflict("id")
        .merge({
          n__de_d_n_i: db.raw("VALUES(n__de_d_n_i)"),
          campana_admision: db.raw("VALUES(campana_admision)"),
          estado_matricula: db.raw("VALUES(estado_matricula)"),
          estado_pagos: db.raw("VALUES(estado_pagos)"),
          estado_postulante: db.raw("VALUES(estado_postulante)"),
          firstname: db.raw("VALUES(firstname)"),

          apellido_paterno: db.raw("VALUES(apellido_paterno)"),
          apellido_materno: db.raw("VALUES(apellido_materno)"),
          tipo_de_documento: db.raw("VALUES(tipo_de_documento)"),
          departamento: db.raw("VALUES(departamento)"),
          provincia_de_procedencia: db.raw("VALUES(provincia_de_procedencia)"),
          distrito_de_procedencia: db.raw("VALUES(distrito_de_procedencia)"),
          distrito: db.raw("VALUES(distrito)"),
          phone: db.raw("VALUES(phone)"),
          mobilphone: db.raw("VALUES(mobilphone)"),
          email: db.raw("VALUES(email)"),
          procedencia: db.raw("VALUES(procedencia)"),
          distrito_del_colegio: db.raw("VALUES(distrito_del_colegio)"),
          colegio_de_procedencia: db.raw("VALUES(colegio_de_procedencia)"),
          ano_de_egreso: db.raw("VALUES(ano_de_egreso)"),
          modalidad_de_estudio: db.raw("VALUES(modalidad_de_estudio)"),
          genero_m__f: db.raw("VALUES(genero_m__f)"),
          carrera_o_especialidad: db.raw("VALUES(carrera_o_especialidad)"),
          fecha_de_inicio_academico: db.raw(
            "VALUES(fecha_de_inicio_academico)",
          ),
          turno: db.raw("VALUES(turno)"),

          lastname: db.raw("VALUES(lastname)"),
          updatedAt: db.raw("VALUES(updatedAt)"),
        });

      console.log(`batch ${Math.floor(i / BATCH_SIZE) + 1} insertado ✓`);
    }

    console.log(`upsert completo. total insertados: ${rows.length} ✓`);

    return true;
  }

  // ===================================================================================
  async upsertManyHubspotConsolidado(data: Api_Hubspot_Consolidado[]) {
    if (!data.length) return true;

    const db = this.db("API_2");
    const BATCH_SIZE = 500;

    const toMysqlDate = (date: any) =>
      date ? new Date(date).toISOString().slice(0, 19).replace("T", " ") : null;

    const rows = data.map((d) => ({
      id: d.id,
      n__de_d_n_i: d.n__de_d_n_i ?? null,
      campana_admision: d.campana_admision ?? null,
      estado_matricula: d.estado_matricula ?? null,
      estado_pagos: d.estado_pagos ?? null,
      estado_postulante: d.estado_postulante ?? null,
      firstname: d.firstname ?? null,
      lastname: d.lastname ?? null,

      apellido_paterno: d.apellido_paterno ?? null,
      apellido_materno: d.apellido_materno ?? null,
      tipo_de_documento: d.tipo_de_documento ?? null,
      departamento: d.departamento ?? null,
      provincia_de_procedencia: d.provincia_de_procedencia ?? null,
      distrito_de_procedencia: d.distrito_de_procedencia ?? null,
      distrito: d.distrito ?? null,
      phone: d.phone ?? null,
      mobilphone: d.mobilphone ?? null,
      email: d.email ?? null,
      procedencia: d.procedencia ?? null,
      distrito_del_colegio: d.distrito_del_colegio ?? null,
      colegio_de_procedencia: d.colegio_de_procedencia ?? null,
      ano_de_egreso: d.ano_de_egreso ?? null,
      modalidad_de_estudio: d.modalidad_de_estudio ?? null,
      genero_m__f: d.genero_m__f ?? null,
      carrera_o_especialidad: d.carrera_o_especialidad ?? null,
      fecha_de_inicio_academico: d.fecha_de_inicio_academico ?? null,
      turno: d.turno ?? null,

      cantidad: d.cantidad,
      ids: d.ids,
      createdAt: toMysqlDate(d.createdAt) ?? toMysqlDate(new Date()),
      updatedAt: toMysqlDate(d.updatedAt) ?? toMysqlDate(new Date()),
    }));

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);

      console.log(
        `insertando batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(rows.length / BATCH_SIZE)} | registros ${i + 1} - ${Math.min(i + BATCH_SIZE, rows.length)}`,
      );

      await db("api_hubspot_consolidado")
        .insert(chunk)
        .onConflict("id")
        .merge({
          n__de_d_n_i: db.raw("VALUES(n__de_d_n_i)"),
          campana_admision: db.raw("VALUES(campana_admision)"),
          estado_matricula: db.raw("VALUES(estado_matricula)"),
          estado_pagos: db.raw("VALUES(estado_pagos)"),
          estado_postulante: db.raw("VALUES(estado_postulante)"),
          firstname: db.raw("VALUES(firstname)"),
          lastname: db.raw("VALUES(lastname)"),

          apellido_paterno: db.raw("VALUES(apellido_paterno)"),
          apellido_materno: db.raw("VALUES(apellido_materno)"),
          tipo_de_documento: db.raw("VALUES(tipo_de_documento)"),
          departamento: db.raw("VALUES(departamento)"),
          provincia_de_procedencia: db.raw("VALUES(provincia_de_procedencia)"),
          distrito_de_procedencia: db.raw("VALUES(distrito_de_procedencia)"),
          distrito: db.raw("VALUES(distrito)"),
          phone: db.raw("VALUES(phone)"),
          mobilphone: db.raw("VALUES(mobilphone)"),
          email: db.raw("VALUES(email)"),
          procedencia: db.raw("VALUES(procedencia)"),
          distrito_del_colegio: db.raw("VALUES(distrito_del_colegio)"),
          colegio_de_procedencia: db.raw("VALUES(colegio_de_procedencia)"),
          ano_de_egreso: db.raw("VALUES(ano_de_egreso)"),
          modalidad_de_estudio: db.raw("VALUES(modalidad_de_estudio)"),
          genero_m__f: db.raw("VALUES(genero_m__f)"),
          carrera_o_especialidad: db.raw("VALUES(carrera_o_especialidad)"),
          fecha_de_inicio_academico: db.raw(
            "VALUES(fecha_de_inicio_academico)",
          ),
          turno: db.raw("VALUES(turno)"),

          cantidad: db.raw("VALUES(cantidad)"),
          ids: db.raw("VALUES(ids)"),
          updatedAt: db.raw("VALUES(updatedAt)"),
        });

      console.log(`batch ${Math.floor(i / BATCH_SIZE) + 1} insertado ✓`);
    }

    console.log(`upsert consolidado completo. total: ${rows.length} ✓`);

    return true;
  }

  // ===================================================================================
  async getContactos() {
    const [rows] = await this.db("API_2").raw(`
      SELECT * FROM api_hubspot
    `);

    return rows as Api_Hubspot[];
  }
}
