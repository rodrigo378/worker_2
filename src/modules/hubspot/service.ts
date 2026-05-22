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

    const grupos = new Map<string, typeof contactos>();
    for (const c of contactos) {
      if (!c.n__de_d_n_i) continue;
      const key = `${c.n__de_d_n_i}-${c.campana_admision}`;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(c);
    }

    const arrayContactos: Api_Hubspot_Consolidado[] = [];
    for (const contac of grupos.values()) {
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
    }

    await this.repo.upsertManyHubspotConsolidado(arrayContactos);
    return true;
  }
  // hubspot.service.ts
  async getSyncEnCurso() {
    return this.repo.getSyncEnCurso();
  }

  // ===================================================================================
  async ejecutarSincronizacionCompleta() {
    const lockName = "hubspot_sync_lock";

    const db = this.repo.db("API_2");
    const conn: any = await db.client.acquireConnection();
    let gotLock = false;

    try {
      const lockResult: any = await conn
        .promise()
        .query(`SELECT GET_LOCK(?, 0) as got_lock`, [lockName]);
      gotLock = lockResult?.[0]?.[0]?.got_lock === 1;

      if (!gotLock) {
        // 👇 buscar el sync en curso para devolver cuando inicio
        const db = this.repo.db("API_2");
        const enCurso: any = await db("api_hubspot_sync_log")
          .whereNull("finishedAt")
          .andWhere("status", "running")
          .orderBy("startedAt", "desc")
          .first();

        return {
          ok: false,
          running: true,
          message: "La sincronización de HubSpot ya se está ejecutando.",
          startedAt: enCurso?.startedAt ?? null,
          currentStage: enCurso?.source ?? null,
          elapsedSeconds: enCurso?.startedAt
            ? Math.floor(
                (Date.now() - new Date(enCurso.startedAt).getTime()) / 1000,
              )
            : null,
        };
      }

      console.log(`[HUBSPOT] Lock '${lockName}' tomado ✓`);

      // 👇 UN SOLO log para toda la sync
      const logId = await this.repo.createSyncLog("hubspot_sync:iniciando");
      let totalContactos = 0;

      try {
        // ETAPA 1: contactos
        await this.repo.updateSyncLog(logId, {
          source: "hubspot_sync:contactos",
        });
        console.log("[HUBSPOT] Sincronizando contactos...");
        totalContactos = await this.sincronizarContactos();
        console.log(`[HUBSPOT] Contactos sincronizados: ${totalContactos}`);

        await this.repo.updateSyncLog(logId, {
          recordsProcessed: totalContactos,
        });

        // ETAPA 2: consolidado
        await this.repo.updateSyncLog(logId, {
          source: "hubspot_sync:consolidado",
        });
        console.log("[HUBSPOT] Sincronizando consolidado...");
        await this.sincronizarConsolidado();
        console.log("[HUBSPOT] Consolidado sincronizado");

        // FINALIZAR EXITOSO
        await this.repo.updateSyncLog(logId, {
          source: "hubspot_sync:completado",
          status: "success",
          recordsProcessed: totalContactos,
          finishedAt: true,
        });

        return {
          ok: true,
          running: false,
          recordsProcessed: totalContactos,
          message: "Sincronización HubSpot completada correctamente.",
        };
      } catch (err: any) {
        // FINALIZAR CON ERROR
        await this.repo.updateSyncLog(logId, {
          status: "failed",
          recordsProcessed: totalContactos,
          error: err?.message ?? String(err),
          finishedAt: true,
        });
        throw err;
      }
    } finally {
      if (gotLock) {
        try {
          await conn.promise().query(`SELECT RELEASE_LOCK(?)`, [lockName]);
          console.log(`[HUBSPOT] Lock '${lockName}' liberado ✓`);
        } catch (e) {
          console.error("[HUBSPOT] Error liberando lock:", e);
        }
      }
      await db.client.releaseConnection(conn);
    }
  }
  // ===================================================================================
  async isSyncRunning() {
    const result = await this.repo.isSyncRunning();
    return result?.[0]?.[0]?.used_by !== null;
  }
}
