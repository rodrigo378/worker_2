"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubspotRepository = void 0;
const node_crypto_1 = require("node:crypto");
// ===================================================================================
class HubspotRepository {
    // ===================================================================================
    constructor(registry) {
        this.registry = registry;
    }
    // ===================================================================================
    db(dbName) {
        return this.registry.get(dbName);
    }
    // ===================================================================================
    async upsertManyHubspot(data) {
        if (!data.length)
            return true;
        const db = this.db("API_2");
        const BATCH_SIZE = 500;
        const toMysqlDate = (date) => date ? new Date(date).toISOString().slice(0, 19).replace("T", " ") : null;
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
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const chunk = rows.slice(i, i + BATCH_SIZE);
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
                fecha_de_inicio_academico: db.raw("VALUES(fecha_de_inicio_academico)"),
                turno: db.raw("VALUES(turno)"),
                lastname: db.raw("VALUES(lastname)"),
                updatedAt: db.raw("VALUES(updatedAt)"),
            });
        }
        return true;
    }
    // ===================================================================================
    async upsertManyHubspotConsolidado(data) {
        if (!data.length)
            return true;
        const db = this.db("API_2");
        const BATCH_SIZE = 500;
        const toMysqlDate = (date) => date ? new Date(date).toISOString().slice(0, 19).replace("T", " ") : null;
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
        const columnasUpdate = [
            "id",
            "estado_matricula",
            "estado_pagos",
            "estado_postulante",
            "firstname",
            "lastname",
            "apellido_paterno",
            "apellido_materno",
            "tipo_de_documento",
            "departamento",
            "provincia_de_procedencia",
            "distrito_de_procedencia",
            "distrito",
            "phone",
            "mobilphone",
            "email",
            "procedencia",
            "distrito_del_colegio",
            "colegio_de_procedencia",
            "ano_de_egreso",
            "modalidad_de_estudio",
            "genero_m__f",
            "carrera_o_especialidad",
            "fecha_de_inicio_academico",
            "turno",
            "cantidad",
            "ids",
            "updatedAt",
        ];
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const chunk = rows.slice(i, i + BATCH_SIZE);
            const idsChunk = chunk.map((r) => r.id);
            const placeholdersIds = idsChunk.map(() => "?").join(",");
            const caseDni = chunk.map(() => "WHEN ? THEN ?").join(" ");
            const caseCamp = chunk.map(() => "WHEN ? THEN ?").join(" ");
            const paramsCaseDni = chunk.flatMap((r) => [r.id, r.n__de_d_n_i]);
            const paramsCaseCamp = chunk.flatMap((r) => [r.id, r.campana_admision]);
            const deleteSql = `
      DELETE FROM \`api_hubspot_consolidado\`
      WHERE id IN (${placeholdersIds})
        AND (
          IFNULL(n__de_d_n_i, '') <> CASE id ${caseDni} ELSE IFNULL(n__de_d_n_i, '') END
          OR IFNULL(campana_admision, '') <> CASE id ${caseCamp} ELSE IFNULL(campana_admision, '') END
        )
    `;
            const deleteParams = [...idsChunk, ...paramsCaseDni, ...paramsCaseCamp];
            const deleteResult = await db.raw(deleteSql, deleteParams);
            // ===========================================================
            // 2. INSERT ... ON DUPLICATE KEY UPDATE batched
            // ===========================================================
            // if (!chunk[0]) return;
            const columnas = Object.keys(chunk[0]);
            const placeholders = chunk
                .map(() => `(${columnas.map(() => "?").join(", ")})`)
                .join(", ");
            const valores = chunk.flatMap((row) => columnas.map((c) => row[c]));
            const updateClause = columnasUpdate
                .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
                .join(", ");
            const sql = `INSERT INTO \`api_hubspot_consolidado\` (${columnas
                .map((c) => `\`${c}\``)
                .join(", ")}) VALUES ${placeholders} ON DUPLICATE KEY UPDATE ${updateClause}`;
            const result = await db.raw(sql, valores);
        }
        return true;
    }
    // ===================================================================================
    async hasRunningSync(source) {
        const db = this.db("API_2");
        const row = await db("api_hubspot_sync_log")
            .where({
            source,
            status: "running",
        })
            .whereNull("finishedAt")
            .first();
        return Boolean(row);
    }
    // ===================================================================================
    async createSyncLog(source) {
        const db = this.db("API_2");
        const id = (0, node_crypto_1.randomUUID)();
        await db("api_hubspot_sync_log").insert({
            id,
            source,
            startedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
            finishedAt: null,
            status: "running",
            recordsProcessed: null,
            error: null,
        });
        return id;
    }
    // ===================================================================================
    async finishSyncLog(id, data) {
        const db = this.db("API_2");
        await db("api_hubspot_sync_log")
            .where({ id })
            .update({
            finishedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
            status: data.status,
            recordsProcessed: data.recordsProcessed ?? null,
            error: data.error ? data.error.slice(0, 191) : null,
        });
        return true;
    }
    // ===================================================================================
    async getContactos() {
        const [rows] = await this.db("API_2").raw(`
      SELECT * FROM api_hubspot
    `);
        return rows;
    }
}
exports.HubspotRepository = HubspotRepository;
//# sourceMappingURL=repository.js.map