export declare class HubspotHttpClient {
    private token;
    private base_url;
    getContactos(after?: string): Promise<{
        results: any[];
        paging: {
            next: {
                after: string;
                link: string;
            };
        };
    }>;
}
//# sourceMappingURL=http.d.ts.map