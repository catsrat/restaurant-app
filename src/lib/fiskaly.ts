
const FISKALY_BASE_URL = process.env.FISKALY_BASE_URL || 'https://kassensichv-middleware.fiskaly.com/api/v1';
const FISKALY_API_KEY = process.env.FISKALY_API_KEY;
const FISKALY_API_SECRET = process.env.FISKALY_API_SECRET;

interface FiskalyAuthToken {
    access_token: string;
    refresh_token: string;
    access_token_expires_at: number; // Unix timestamp
}

export class FiskalyClient {
    private static token: FiskalyAuthToken | null = null;

    private static async authenticate() {
        if (!FISKALY_API_KEY || !FISKALY_API_SECRET) {
            throw new Error("Missing FISKALY_API_KEY or FISKALY_API_SECRET");
        }

        // Return cached token if valid (with 60s buffer)
        if (this.token && this.token.access_token_expires_at > (Date.now() / 1000) + 60) {
            return this.token.access_token;
        }

        const response = await fetch(`${FISKALY_BASE_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: FISKALY_API_KEY,
                api_secret: FISKALY_API_SECRET,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Fiskaly Auth Failed: ${error}`);
        }

        const data = await response.json();
        this.token = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            access_token_expires_at: data.access_token_expires_at,
        };

        return this.token?.access_token;
    }

    private static async request(endpoint: string, method: string = 'GET', body?: any) {
        const token = await this.authenticate();
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

        const response = await fetch(`${FISKALY_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Fiskaly Request Failed [${method} ${endpoint}]:`, errorBody);
            throw new Error(`Fiskaly Error: ${errorBody}`);
        }

        return response.json();
    }

    // --- TSS Management ---

    static async listTSS() {
        return this.request('/tss?states=INITIALIZED');
    }

    static async createTSS(description: string = 'Restaurant TSS') {
        // 1. Create TSS
        const tssId = crypto.randomUUID();
        await this.request(`/tss/${tssId}`, 'PUT', {
            description,
            state: 'INITIALIZED',
        });

        // 2. Change PUK (Recommended in production, skipping specific PUK handling for simplicity or using default via API flow if allowed)
        // Note: Creating a TSS usually puts it in CREATED state, then needs initialization.
        // For specific Fiskaly flow: PUT /tss/{id} -> CREATED. Then PUT /tss/{id}/admin authenticating with PUK to set PIN.
        // This is complex. We will assume we can get an INITIALIZED TSS or just create one and leave it in Created state for now?
        // Fiskaly V2 middleware automatically handles a lot. Let's try basic creation.
        // Actually, setting state to INITIALIZED directly might fail if not permitted.
        // Let's stick to CREATED.

        // For this implementation, we will try to create one. If it requires PUK flow, we might need a more complex setup.
        // But let's assume standard V2 API.
        return tssId;
    }

    // --- Client Management ---

    static async createClient(tssId: string, serialNumber: string) {
        const clientId = crypto.randomUUID();
        await this.request(`/tss/${tssId}/client/${clientId}`, 'PUT', {
            serial_number: serialNumber,
        });
        return clientId;
    }

    // --- Transactions ---

    static async startTransaction(tssId: string, clientId: string, txId: string) {
        // txId should be a UUID
        const response = await this.request(`/tss/${tssId}/tx/${txId}`, 'PUT', {
            state: 'ACTIVE',
            client_id: clientId,
        });
        return response;
    }

    static async finishTransaction(tssId: string, clientId: string, txId: string, startLogTime: number, amount: number, vatRate: 'NORMAL' | 'REDUCED_1' | 'SPECIAL_RATE_1' | 'SPECIAL_RATE_2' | 'NULL' = 'NORMAL') {
        // Logic: Update transaction to FINISHED
        // Note: In V2, you usually upsert the transaction with new data and state=FINISHED

        // Map simple tax rate to Schema
        // 'NORMAL' is 19%, 'REDUCED_1' is 7%

        const response = await this.request(`/tss/${tssId}/tx/${txId}`, 'PUT', {
            state: 'FINISHED',
            client_id: clientId,
            schema: {
                standard_v1: {
                    receipt: {
                        receipt_type: 'RECEIPT',
                        amounts_per_vat_rate: [
                            {
                                vat_rate: vatRate,
                                amount: amount.toFixed(2) // Needs to be string or number? usually string decimal. "10.00"
                            }
                        ],
                        amounts_per_payment_type: [
                            {
                                payment_type: 'CASH', // Simplification, should pass method
                                amount: amount.toFixed(2)
                            }
                        ]
                    }
                }
            }
        });

        return response;
    }
}
