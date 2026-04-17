import type { Knex } from "knex";
import { DateTime } from "luxon";

import type { DbRegistry } from "../../core/db/registry";

export type DbName = "SIGU_LECTURA" | "SIGU_INSERT";

export type AlumnoRow = {
  codigo: string;
  nombre_completo: string;
  facultad: string;
  c_codesp: string;
};

export type MatriculadoShortnameRow = {
  CODIGO: string;
  nombre_completo: string;
  facultad: string;
  c_codesp: string;
};

export type HorarioGrupoRow = Record<string, any>;

export type GrupoCourseRow = {
  CODIGO: string;
  courseid: number;
  Curso: string;
  CodigoCurso: string;
  SeccionCurso: string;
  PeriodoCurso: number;
  PlanCurso: number;
  Facultad: string;
  Especialidad: string;
  CodMod: string;
  EstadoMatricula: string;
  estado_final: "RETIRADO" | "MATRICULADO";
};

type AsisHeaderKey = {
  n_codper: number;
  c_codmod: string;
  c_codfac: string;
  c_codesp: string;
  c_codcur: string;
  c_grpcur: string;
  n_codpla: number;
  c_sedcod?: string | null;
  c_dnidoc?: string | null;
  d_fecha: string;
  tipo: string;
};

type AsisHeaderData = {
  c_tema?: string | null;
  mins?: string | null;
  c_user_upd?: string | null;
};

type AsisHeaderKeyNew = {
  n_codper: number;
  c_codmod: string;
  c_codfac: string;
  c_codesp: string;
  c_codcur: string;
  c_grpcur: string;
  n_codpla: number;
  d_fecha: string;
};

export class ZoomRepository {
  constructor(private readonly registry: DbRegistry) {}

  private db(dbName: DbName): Knex {
    return this.registry.get(dbName);
  }

  async getEstudiantes() {
    const [rows] = await this.db("SIGU_LECTURA").raw(
      'select codigo, CONCAT(nombres, " ", paterno, " ", materno) as nombre_completo, facultad, c_codesp from alumno where facultad in ("E","S")',
    );

    return rows as AlumnoRow[];
  }

  async getMatriculadosByShortname(shortname: string, periodo: number) {
    const [rows] = await this.db("SIGU_LECTURA").raw(
      `
      SELECT DISTINCT
        a.c_codalu AS CODIGO,
        CONCAT(d.nombres, ' ', d.paterno, ' ', d.materno) AS nombre_completo,
        e.c_email_institucional as email,
        a.c_codfac_alu AS facultad,
        a.c_codesp_alu AS c_codesp
      FROM tb_alu_cur_grp a
      INNER JOIN tb_curso_grupo_sincro s
        ON a.n_codper = s.n_codper
        AND a.c_codcur = s.c_codcur
        AND a.n_codpla = s.n_codpla
        AND a.c_grpcur = s.c_grpcur
        AND a.c_codfac_alu = s.c_codfac
        AND a.c_codesp_alu = s.c_codesp
        AND a.c_codmod = s.c_codmod
      INNER JOIN alumno d
        ON d.codigo = a.c_codalu
      INNER JOIN tb_ficha_perso_alu e
        ON e.c_codalu = a.c_codalu
      WHERE
        a.n_codper = ?
        AND a.c_codfac_alu IN ('E','S')
        AND a.c_codalu NOT IN (2119921,12345678)
        AND a.c_estado <> 'R'
        AND s.shortname = ?
      `,
      [periodo, shortname],
    );

    return rows;
  }

  async getGrupoPorShortname(
    shortname: string,
    periodo: number,
  ): Promise<GrupoCourseRow[]> {
    const [rows] = await this.db("SIGU_LECTURA").raw(
      `
      select 					
        distinct a.c_codalu as CODIGO,
        s.courseid,
        b.c_nomcur as Curso,
        a.c_codcur as CodigoCurso,
        a.c_grpcur as SeccionCurso,
        a.n_codper as PeriodoCurso,
        a.n_codpla as PlanCurso,
        a.c_codfac_alu AS Facultad, 
        a.c_codesp_alu as Especialidad,
        a.c_codmod as CodMod,
        a.c_estado as EstadoMatricula,
        case 
          when sum(case when a.c_estado = 'A' then 1 else 0 end) = count(*)  
          then 'RETIRADO'
          else 'MATRICULADO'
        end as estado_final
      from tb_alu_cur_grp a    
      left join tb_plan_estudio_curso b   
        on a.c_codcur = b.c_codcur 
        and a.c_codmod = b.c_codmod
        and a.c_codfac = b.c_codfac 
        and a.c_codesp = b.c_codesp
        and a.n_codpla = b.n_codper 
      inner join tb_curso_grupo_sincro s
        on a.n_codper = s.n_codper
        and a.c_codcur = s.c_codcur
        and a.n_codpla = s.n_codpla
        and a.c_grpcur = s.c_grpcur
        and a.c_codfac_alu = s.c_codfac
        and a.c_codesp_alu = s.c_codesp
        and a.c_codmod = s.c_codmod
      where 
        a.n_codper = ?
        and a.c_codfac_alu in ('E', 'S')
        and a.c_codalu not in (2119921,12345678) 
        and s.shortname = ?
      group by 
        a.c_codalu,
        s.courseid,
        b.c_nomcur,
        a.c_codcur,
        a.n_codper, 
        a.c_estado,
        a.c_codfac_alu, 
        a.c_codesp_alu,
        a.c_grpcur,
        a.n_codpla,
        a.c_codmod;
      `,
      [periodo, shortname],
    );

    return rows as GrupoCourseRow[];
  }

  /**
   * Busca un header existente en tb_asis_alum con la "llave" dada.
   * Si no existe, crea uno y retorna id_asistencia.
   *
   * OJO: Sin UNIQUE en BD, esto puede duplicar si se ejecuta en paralelo.
   */
  async ensureAsistenciaHeader(
    key: AsisHeaderKey,
    data: AsisHeaderData,
    classStartIso: string,
  ): Promise<number> {
    const existing = await this.db("SIGU_INSERT")("tb_asis_alum")
      .select("id_asistencia")
      .where({
        n_codper: key.n_codper,
        c_codmod: key.c_codmod,
        c_codfac: key.c_codfac,
        c_codesp: key.c_codesp,
        c_codcur: key.c_codcur,
        c_grpcur: key.c_grpcur,
        n_codpla: key.n_codpla,
        d_fecha: key.d_fecha,
      })
      .first();

    if (existing?.id_asistencia) return existing.id_asistencia as number;

    const classStart = DateTime.fromISO(classStartIso).toJSDate();

    const insertRow = {
      n_codper: key.n_codper,
      c_codmod: key.c_codmod,
      c_codfac: key.c_codfac,
      c_codesp: key.c_codesp,
      c_codcur: key.c_codcur,
      c_grpcur: key.c_grpcur,
      n_codpla: key.n_codpla,
      c_sedcod: key.c_sedcod ?? null,
      c_dnidoc: key.c_dnidoc ?? null,

      d_fecha: key.d_fecha,
      d_fecha_registro: key.d_fecha,

      c_estado: "A",
      c_tema: "tema tema",
      mins: 0,
      c_user_upd: data.c_user_upd ?? null,

      d_fecha_upd: classStart,

      tipo: 1,
      auto: 0,
    };

    const [id] = await this.db("SIGU_INSERT")("tb_asis_alum").insert(insertRow);
    return id as number;
  }

  /**
   * Inserta detalle en tb_asis_alum_det (id_asistencia, c_codalu) con c_estado='A'.
   * Si ya existe, actualiza a 'A'.
   */

  async upsertAsistenciaDetalleConEstado(
    id_asistencia: number,
    rowsDet: Array<{ c_codalu: string; c_estado: string }>,
    classStartIso: string,
  ): Promise<void> {
    if (rowsDet.length === 0) return;

    const classStart = DateTime.fromISO(classStartIso).toJSDate();

    const rows = rowsDet.map((r) => ({
      id_asistencia,
      c_codalu: r.c_codalu,
      c_estado: r.c_estado,
    }));

    await this.db("SIGU_INSERT")("tb_asis_alum_det")
      .insert(rows)
      .onConflict(["id_asistencia", "c_codalu"])
      .merge({
        c_estado: this.db("SIGU_INSERT").raw("VALUES(c_estado)"),
      });
  }

  async getHorarioGrupoPorShortname(shortname: string) {
    const [rows] = await this.db("SIGU_LECTURA").raw(
      `
    SELECT 
      h.*
    FROM 
      tb_curso_grupo_sincro s
    JOIN 
      tb_cur_grp_hor h
      ON s.n_codper  = h.n_codper
      AND s.c_codfac = h.c_codfac
      AND s.c_codesp = h.c_codesp
      AND s.c_sedcod = h.c_sedcod
      AND s.c_codcur = h.c_codcur
      AND s.c_grpcur = h.c_grpcur
      AND s.c_codmod = h.c_codmod
      AND s.n_codpla = h.n_codpla
    WHERE 
      s.shortname = ?
    `,
      [shortname],
    );

    return rows as HorarioGrupoRow[];
  }

  async todo(shortname: string) {
    const [rows] = await this.db("SIGU_LECTURA").raw(
      `select * from tb_curso_grupo_sincro where shortname = ?`,
      [shortname],
    );
    return rows as Array<Record<string, any>>;
  }

  async getHorarioPorSincro(s: {
    n_codper: number;
    c_codfac: string;
    c_codesp: string;
    c_sedcod: string;
    c_codcur: string;
    c_grpcur: string;
    c_codmod: string;
    n_codpla: number;
  }) {
    const [rows] = await this.db("SIGU_LECTURA").raw(
      `
      SELECT h.*
      FROM tb_cur_grp_hor h
      WHERE
        h.n_codper  = ?
        AND h.c_codfac = ?
        AND h.c_codesp = ?
        AND h.c_sedcod = ?
        AND h.c_codcur = ?
        AND h.c_grpcur = ?
        AND h.c_codmod = ?
        AND h.n_codpla = ?
    `,
      [
        s.n_codper,
        s.c_codfac,
        s.c_codesp,
        s.c_sedcod,
        s.c_codcur,
        s.c_grpcur,
        s.c_codmod,
        s.n_codpla,
      ],
    );

    return rows as Array<Record<string, any>>;
  }

  async getMatriculadosPorSincro(s: {
    n_codper: number;
    c_codfac: string;
    c_codesp: string;
    c_codcur: string;
    c_grpcur: string;
    c_codmod: string;
    n_codpla: number;
  }) {
    const [rows] = await this.db("SIGU_LECTURA").raw(
      `
    SELECT DISTINCT a.c_codalu AS CODIGO
    FROM tb_alu_cur_grp a
    WHERE
      a.n_codper = ?
      AND a.c_codfac_alu = ?
      AND a.c_codesp_alu = ?
      AND a.c_codcur = ?
      AND a.c_grpcur = ?
      AND a.c_codmod = ?
      AND a.n_codpla = ?
      AND a.c_codalu not in (2119921,12345678)
      AND a.c_estado <> 'R'
    `,
      [
        s.n_codper,
        s.c_codfac,
        s.c_codesp,
        s.c_codcur,
        s.c_grpcur,
        s.c_codmod,
        s.n_codpla,
      ],
    );

    return rows as Array<{ CODIGO: string }>;
  }

  async headerExistsByNewKey(key: AsisHeaderKeyNew): Promise<number | null> {
    const existing = await this.db("SIGU_INSERT")("tb_asis_alum")
      .select("id_asistencia")
      .where({
        n_codper: key.n_codper,
        c_codmod: key.c_codmod,
        c_codfac: key.c_codfac,
        c_codesp: key.c_codesp,
        c_codcur: key.c_codcur,
        c_grpcur: key.c_grpcur,
        n_codpla: key.n_codpla,
        d_fecha: key.d_fecha,
      })
      .first();

    return existing?.id_asistencia ? Number(existing.id_asistencia) : null;
  }

  async insertHeaderIfNotExistsByNewKey(
    key: AsisHeaderKeyNew,
    data: AsisHeaderData,
    classStartIso: string,
    extra?: {
      c_sedcod?: string | null;
      c_dnidoc?: string | null;
      c_tema?: string | null;
      mins?: number | null;
      tipo?: number;
      auto?: number;
    },
  ): Promise<number | null> {
    const existsId = await this.headerExistsByNewKey(key);
    if (existsId) return null;

    const classStart = DateTime.fromISO(classStartIso).toJSDate();

    const insertRow = {
      n_codper: key.n_codper,
      c_codmod: key.c_codmod,
      c_codfac: key.c_codfac,
      c_codesp: key.c_codesp,
      c_codcur: key.c_codcur,
      c_grpcur: key.c_grpcur,
      n_codpla: key.n_codpla,

      d_fecha: key.d_fecha,

      // ✅ IMPORTANTES (antes los tenías en ensureAsistenciaHeader)
      d_fecha_registro: key.d_fecha,
      c_estado: "A",

      // opcionales
      c_sedcod: extra?.c_sedcod ?? null,
      c_dnidoc: extra?.c_dnidoc ?? null,
      c_tema: extra?.c_tema ?? "tema tema",
      mins: (extra?.mins ?? 0) as any,
      c_user_upd: data.c_user_upd ?? null,

      d_fecha_upd: classStart,

      tipo: extra?.tipo ?? 1,
      auto: extra?.auto ?? 0,
    };

    const [id] = await this.db("SIGU_INSERT")("tb_asis_alum").insert(insertRow);
    return Number(id);
  }
}
