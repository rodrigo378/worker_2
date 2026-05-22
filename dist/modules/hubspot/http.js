"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubspotHttpClient = void 0;
const env_1 = require("../../core/config/env");
const undici_1 = require("undici");
class HubspotHttpClient {
    constructor() {
        this.token = env_1.env.HUBSPOT.TOKEN;
        this.base_url = env_1.env.HUBSPOT.BASE_URL;
    }
    async getContactos(after) {
        const page_size = 100;
        const params = new URLSearchParams({
            limit: String(page_size),
            properties: [
                "n__de_d_n_i",
                "campana_admision",
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
            ].join(","),
        });
        if (after)
            params.set("after", after);
        const res = await (0, undici_1.request)(`${this.base_url}/crm/v3/objects/contacts?${params.toString()}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
        });
        if (res.statusCode < 200 || res.statusCode >= 300) {
            const errorBody = await res.body.text();
            throw new Error(`HubSpot list error: ${res.statusCode} - ${errorBody}`);
        }
        return (await res.body.json());
    }
}
exports.HubspotHttpClient = HubspotHttpClient;
//# sourceMappingURL=http.js.map