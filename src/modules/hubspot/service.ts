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
    console.log("iniciando sincronización...");

    let after: string | undefined;
    let pagina = 1;
    let totalInsertados = 0;
    const BUFFER_SIZE = 1000; // acumula 1000 y luego inserta
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
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }),
      );

      buffer.push(...responseContactos);
      after = response.paging?.next?.after;

      console.log(
        `página ${pagina++} | buffer: ${buffer.length} | siguiente: ${after ?? "ninguno (último)"}`,
      );

      // cuando el buffer llega a 1000 inserta y vacía
      if (buffer.length >= BUFFER_SIZE) {
        console.log(`insertando buffer de ${buffer.length}...`);
        await this.repo.upsertManyHubspot(buffer);
        totalInsertados += buffer.length;
        console.log(`insertados hasta ahora: ${totalInsertados} ✓`);
        buffer = []; // vacía el buffer
      }
    } while (after);

    // inserta lo que quedó en el buffer al final
    if (buffer.length > 0) {
      console.log(`insertando resto: ${buffer.length}...`);
      await this.repo.upsertManyHubspot(buffer);
      totalInsertados += buffer.length;
    }

    console.log(
      `sincronización completa. total insertados: ${totalInsertados} ✓`,
    );

    return totalInsertados;
  }

  // ===================================================================================
  async sincronizarConsolidado() {
    const contactos = await this.repo.getContactos();

    const arrayContactos: Api_Hubspot_Consolidado[] = [];

    const seen = new Set<string>();

    const contactosUnicos = contactos.filter((c) => {
      if (!c.n__de_d_n_i) return false; // <-- excluye null/undefined/vacío

      const key = `${c.n__de_d_n_i}-${c.campana_admision}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    contactosUnicos.map((cu) => {
      const contac = contactos.filter(
        (c) =>
          c.n__de_d_n_i && // <-- excluye null
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
