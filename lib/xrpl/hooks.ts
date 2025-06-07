'use client';

import { useState } from 'react';
import * as xrpl from 'xrpl';

const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

export function useXrpl() {
    // Note: The 'client' and 'wallet' in state are for convenience if you need to access them elsewhere,
    // but the core functions will now manage their instances directly to avoid async state issues.
    const [client, setClient] = useState<xrpl.Client | null>(null);
    const [wallet, setWallet] = useState<xrpl.Wallet | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connect = async (): Promise<xrpl.Client> => {
        setIsLoading(true);
        setError(null);
        try {
            const xrplClient = new xrpl.Client(TESTNET_URL);
            await xrplClient.connect();
            setClient(xrplClient); // Set state for external use
            return xrplClient; // Return instance for immediate use
        } catch (err) {
            console.error('Error connecting to XRPL:', err);
            setError('Failed to connect to the XRPL Testnet.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const disconnect = () => {
        client?.disconnect();
        setClient(null);
        setWallet(null);
    };

    const getTestnetFundingWallet = async (xrplClient: xrpl.Client): Promise<xrpl.Wallet> => {
        if (!xrplClient) {
            throw new Error("XRPL client is not provided.");
        }
        setIsLoading(true);
        setError(null);
        try {
            const fundResult = await xrplClient.fundWallet();
            const newWallet = fundResult.wallet;
            setWallet(newWallet);
            return newWallet;
        } catch (err) {
            console.error('Error generating wallet:', err);
            setError('Failed to generate and fund a new wallet. Please try again.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };
    
    const createConditionalEscrow = async (
        xrplClient: xrpl.Client,
        funderWallet: xrpl.Wallet,
        amount: string, 
        destination: string, 
        condition: string,
        cancelAfterDate?: Date
    ): Promise<xrpl.TxResponse<xrpl.EscrowCreate>> => {
        setIsLoading(true);
        setError(null);
        try {
            const cancelAfter = cancelAfterDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1));
            const rippleEpochOffset = 946684800;
            const cancelAfterRippleTime = Math.floor(cancelAfter.getTime() / 1000) - rippleEpochOffset;

            const escrowTx: xrpl.EscrowCreate = {
                "TransactionType": "EscrowCreate",
                "Account": funderWallet.address,
                "Amount": xrpl.xrpToDrops(amount),
                "Destination": destination,
                "CancelAfter": cancelAfterRippleTime,
                "Condition": condition
            };
            
            await xrplClient.autofill(escrowTx);
            
            const signed = funderWallet.sign(escrowTx);
            const tx = await xrplClient.submitAndWait(signed.tx_blob);

            return tx as xrpl.TxResponse<xrpl.EscrowCreate>;
        } catch (err) {
            console.error('Error creating conditional escrow:', err);
            setError('Failed to create the conditional escrow.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const finishMilestoneEscrow = async (
        developerSeed: string, // The developer's secret key is needed to sign the finish tx
        owner: string, // This is the address of the temporary funder wallet
        offerSequence: number,
        condition: string,
        fulfillment: string
    ) => {
        let xrplClient: xrpl.Client | null = null;
        try {
            setIsLoading(true);
            setError(null);
            xrplClient = await connect();

            const developerWallet = xrpl.Wallet.fromSeed(developerSeed);

            const prepared: xrpl.EscrowFinish = {
                "TransactionType": "EscrowFinish",
                "Account": developerWallet.address,
                "Owner": owner,
                "OfferSequence": offerSequence,
                "Condition": condition,
                "Fulfillment": fulfillment
            };
            
            await xrplClient.autofill(prepared);
            const signed = developerWallet.sign(prepared);
            const tx = await xrplClient.submitAndWait(signed.tx_blob);

            return { success: true, result: tx };

        } catch (err: any) {
            console.error('Error finishing escrow:', err);
            setError(err.message || 'Failed to finish the escrow.');
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
            if (xrplClient) await xrplClient.disconnect();
        }
    };

    return {
        isLoading,
        error,
        connect,
        disconnect,
        getTestnetFundingWallet,
        createConditionalEscrow,
        finishMilestoneEscrow,
    };
} 