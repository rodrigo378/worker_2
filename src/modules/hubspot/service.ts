import { HubspotHttpClient } from "./http";
import { HubspotRepository } from "./repository";
import { Api_Hubspot } from "./types/db.types";

export class HubspotService {
  constructor(
    private readonly http: HubspotHttpClient,
    private readonly repo: HubspotRepository,
  ) {}

  async sincronizarContactos(limit: number = 300) {
    const contactos: Api_Hubspot[] = [];

    let after: string | undefined;

    do {
      const response = await this.http.getContactos(after);

      const responseContactos: Api_Hubspot[] = response.results.map(
        (c: any) => {
          return {
            id: c.id,
            n__de_d_n_i: c.properties.n__de_d_n_i ?? null,
            campana_admision: c.properties.campana_admision ?? null,
            estado_matricula: c.properties.estado_matricula ?? null,
            estado_pagos: c.properties.estado_pagos ?? null,
            estado_postulante: c.properties.estado_postulante ?? null,
            firstname: c.properties.firstname ?? null,
            lastname: c.properties.lastname ?? null,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          };
        },
      );

      contactos.push(...responseContactos);

      if (contactos.length >= limit) {
        return contactos.slice(0, limit);
      }

      after = response.paging?.next?.after;
    } while (after);

    return contactos;
  }
}
