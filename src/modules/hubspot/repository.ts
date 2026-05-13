import { Knex } from "knex";
import { DbName } from "../../core/const/db.const";
import { DbRegistry } from "../../core/db/registry";
import { Api_Hubspot } from "./types/db.types";
import { merge } from "zod/v4/core/util.cjs";

// ===================================================================================
export class HubspotRepository {
  // ===================================================================================
  constructor(private readonly registry: DbRegistry) {}

  //   model Api_Hubspot {
  //   id               String  @id
  //   n__de_d_n_i      String?
  //   campana_admision String?

  //   estado_matricula  String?
  //   estado_pagos      String?
  //   estado_postulante String?

  //   firstname String?
  //   lastname  String?

  //   createdAt DateTime
  //   updatedAt DateTime

  //   @@map("api_hubspot")
  // }

  private db(dbName: DbName): Knex {
    return this.registry.get(dbName);
  }

  // ===================================================================================
  async upsertManyHubspot(data: Api_Hubspot[]) {
    if (!data.length) return true;

    const db = this.db("API_2");

    const rows = data.map((d) => ({
      id: d.id,
      n__de_d_n_i: d.n__de_d_n_i ?? null,
      campana_admision: d.campana_admision ?? null,
      estado_matricula: d.estado_matricula ?? null,
      estado_pagos: d.estado_pagos ?? null,
      estado_postulante: d.estado_postulante ?? null,
      firstname: d.firstname ?? null,
      lastname: d.lastname ?? null,
      created_at: d.createdAt ?? new Date(),
      updated_at: d.updatedAt ?? new Date(),
    }));

    await db("api_hubspot")
      .insert(rows)
      .onConflict("id")
      .merge({
        n__de_d_n_i: db.raw("VALUES(n__de_d_n_i)"),
        campana_admision: db.raw("VALUES(campana_admision)"),
        estado_matricula: db.raw("VALUES(estado_matricula)"),
        estado_pagos: db.raw("VALUES(estado_pagos)"),
        estado_postulante: db.raw("VALUES(estado_postulante)"),
        firstname: db.raw("VALUES(firstname)"),
        lastname: db.raw("VALUES(lastname)"),
        updated_at: db.raw("VALUES(updated_at)"),
      });

    return true;
  }
}
