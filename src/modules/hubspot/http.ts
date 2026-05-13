import { env } from "../../core/config/env";
import { request } from "undici";

export class HubspotHttpClient {
  private token = env.HUBSPOT.TOKEN;
  private base_url = env.HUBSPOT.BASE_URL;

  async getContactos(after?: string) {
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
      ].join(","),
    });

    if (after) params.set("after", after);

    const res = await request(
      `${this.base_url}/crm/v3/objects/contacts?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (res.statusCode < 200 || res.statusCode >= 300) {
      const errorBody = await res.body.text();
      throw new Error(`HubSpot list error: ${res.statusCode} - ${errorBody}`);
    }

    return (await res.body.json()) as {
      results: any[];
      paging: {
        next: {
          after: string;
          link: string;
        };
      };
    };
  }
}
