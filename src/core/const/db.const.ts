//* src/common/const/modulo.const.ts

// ===================================================================================
export const DB_NAME = {
  API_2: "API_2",
  SIGU_LECTURA: "SIGU_LECTURA",
  SIGU_INSERT: "SIGU_INSERT",
} as const;

// ===================================================================================
export type DbName = (typeof DB_NAME)[keyof typeof DB_NAME];
