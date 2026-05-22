import { z } from "zod";
declare const ConnSchema: z.ZodObject<{
    name: z.ZodString;
    host: z.ZodString;
    port: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    database: z.ZodString;
    user: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type DbConn = z.infer<typeof ConnSchema>;
export declare const env: {
    PORT: number;
    HOST: string;
    HUBSPOT: {
        TOKEN: string;
        BASE_URL: string;
    };
    ZOOM: {
        BASE_URL: string;
        ACCOUNT_ID: string;
        CLIENT_ID: string;
        CLIENT_SECRET: string;
    };
    REDIS: {
        HOST: string;
        PORT: number;
        PASSWORD: string | undefined;
    };
    DB_CONNECTIONS: DbConn[];
};
export {};
//# sourceMappingURL=env.d.ts.map