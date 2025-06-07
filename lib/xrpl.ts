import * as xrpl from 'xrpl';

const RIPPLE_TESTNET_URL = "wss://s.altnet.rippletest.net:51233/";

let client: xrpl.Client;

async function getClient(): Promise<xrpl.Client> {
    if (client && client.isConnected()) {
        return client;
    }
    client = new xrpl.Client(RIPPLE_TESTNET_URL);
    await client.connect();
    return client;
}

export async function getXrpBalance(address: string): Promise<number | null> {
    if (!xrpl.isValidAddress(address)) {
        console.error("Invalid XRP address provided to getXrpBalance:", address);
        return null;
    }
    
    try {
        const xrplClient = await getClient();
        const balance = await xrplClient.getXrpBalance(address);
        return balance;
    } catch (error) {
        console.error("Error fetching XRP balance:", error);
        // In a real-world scenario, you might want to handle different types of errors differently.
        // For now, we return null to indicate failure.
        return null;
    }
}

// Optional: A function to gracefully disconnect when the app is shutting down.
// This is more relevant for long-running server processes.
export async function disconnectClient(): Promise<void> {
    if (client && client.isConnected()) {
        await client.disconnect();
    }
} 