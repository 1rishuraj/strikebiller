import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Biller } from './types/biller'; 
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import idl from './idl/biller.json'; 
import { Connection, PublicKey, SystemProgram, Transaction, TransactionSignature } from '@solana/web3.js';
import { getAccount,ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, createTransferCheckedInstruction } from '@solana/spl-token';
import { BN } from 'bn.js';
import { SubscriptionPlan, Subscription } from '@/utils/interfaces';

// Devnet USDC Mint
export const DEVNET_TOKEN_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

export const useBillerProgram = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    return new Program<Biller>(idl as any, provider);
  }, [connection, wallet]);

  return { program, provider: program?.provider as AnchorProvider };
};

// Initialize a new Plan (Merchant)
export const initializePlan = async (
  program: Program<Biller>,
  merchantPubkey: PublicKey,
  planId: string,
  priceUi: number,
  cycleSeconds: number
): Promise<TransactionSignature> => {
  try {
    const provider = program.provider as AnchorProvider;
    const connection = provider.connection;

    const [planPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("plan"), merchantPubkey.toBuffer(), Buffer.from(planId)],
      program.programId
    );

    const priceBN = new BN(priceUi * 1e6); 
    const cycleBN = new BN(cycleSeconds);

    const tx = new Transaction();

    const merchantAta = getAssociatedTokenAddressSync(DEVNET_TOKEN_MINT, merchantPubkey);
    try {
      await getAccount(connection, merchantAta);
    } catch (e: any) {
      if (e.name === "TokenAccountNotFoundError" || e.message.includes("could not find account")) {
        console.log("Merchant ATA not found. Bundling creation instruction...");
        tx.add(
          createAssociatedTokenAccountInstruction(
            merchantPubkey, merchantAta, merchantPubkey, DEVNET_TOKEN_MINT
          )
        );
      }
    }

    // Add the initialize plan instruction
    const initIx = await program.methods
      .initializePlan(planId, priceBN, cycleBN)
      .accountsStrict({
        plan: planPda,
        merchant: merchantPubkey,
        tokenMint: DEVNET_TOKEN_MINT,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(initIx);

    const txSignature = await provider.sendAndConfirm(tx);
    console.log("Plan created successfully! Signature:", txSignature);
    return txSignature;
  } catch (error) {
    console.error("Error initializing plan:", error);
    throw error;
  }
};

// Subscribe & Fund Vault (Subscriber)
export const subscribeToPlan = async (
  program: Program<Biller>,
  subscriberPubkey: PublicKey,
  merchantPubkey: PublicKey,
  planId: string,
  depositUi: number 
): Promise<TransactionSignature> => {
  try {
    const provider = program.provider as AnchorProvider;
    const connection = provider.connection;

    const subscriberAta = getAssociatedTokenAddressSync(DEVNET_TOKEN_MINT, subscriberPubkey);
    
    await checkSubscriberBalance(connection, subscriberAta, depositUi);

    const [planPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("plan"), merchantPubkey.toBuffer(), Buffer.from(planId)],
      program.programId
    );

    const [subsPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("subscription"), subscriberPubkey.toBuffer(), planPda.toBuffer()],
      program.programId
    );

    const vaultAta = getAssociatedTokenAddressSync(DEVNET_TOKEN_MINT, subsPda, true);
    
    const depositBN = new BN(depositUi * 1e6);
    const tx = new Transaction();

    const subscribeIx = await program.methods
      .subscribe(depositBN)
      .accountsStrict({
        plan: planPda,
        subscription: subsPda,
        subscriber: subscriberPubkey,
        subscriberAta: subscriberAta,
        vault: vaultAta,
        tokenMint: DEVNET_TOKEN_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(subscribeIx);

    const txSignature = await provider.sendAndConfirm(tx);
    return txSignature;
  } catch (error) {
    throw error; // Let the UI catch and display the specific error
  }
};

// Toggle Vacation Mode (Subscriber or Merchant)
export const toggleSubscription = async (
  program: Program<Biller>,
  signerPubkey: PublicKey,
  merchantPubkey: PublicKey, // Needed to derive the plan PDA
  planId: string,
  subscriberPubkey: PublicKey // Usually same as signer, unless merchant is toggling it
): Promise<TransactionSignature> => {
  try {
    const [planPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("plan"), merchantPubkey.toBuffer(), Buffer.from(planId)],
      program.programId
    );

    const [subsPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("subscription"), subscriberPubkey.toBuffer(), planPda.toBuffer()],
      program.programId
    );

    const txSignature = await program.methods
      .toggleSubscription()
      .accountsStrict({
        signer: signerPubkey,
        plan: planPda,
        subscription: subsPda,
      })
      .rpc();

    console.log("Toggled successfully! Signature:", txSignature);
    return txSignature;
  } catch (error) {
    console.error("Error toggling:", error);
    throw error;
  }
};

// Cancel Subscription & Refund Vault (Subscriber)
export const cancelSubscription = async (
  program: Program<Biller>,
  subscriberPubkey: PublicKey,
  merchantPubkey: PublicKey,
  planId: string
): Promise<TransactionSignature> => {
  try {
    const provider = program.provider as AnchorProvider;
    const connection = provider.connection;

    const [planPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("plan"), merchantPubkey.toBuffer(), Buffer.from(planId)],
      program.programId
    );

    const [subsPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("subscription"), subscriberPubkey.toBuffer(), planPda.toBuffer()],
      program.programId
    );

    const subscriberAta = getAssociatedTokenAddressSync(DEVNET_TOKEN_MINT, subscriberPubkey);
    const vaultAta = getAssociatedTokenAddressSync(DEVNET_TOKEN_MINT, subsPda, true);

    const tx = new Transaction();

    // Safety: Ensure user hasn't closed their ATA so they can receive the refund!
    const ataInfo = await connection.getAccountInfo(subscriberAta);
    if (!ataInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          subscriberPubkey, subscriberAta, subscriberPubkey, DEVNET_TOKEN_MINT
        )
      );
    }

    const cancelIx = await program.methods
      .cancelSubscription()
      .accountsStrict({
        plan: planPda,
        vault: vaultAta,
        subscription: subsPda,
        subscriberAta: subscriberAta,
        subscriber: subscriberPubkey,
        tokenMint: DEVNET_TOKEN_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    tx.add(cancelIx);

    const txSignature = await provider.sendAndConfirm(tx);
    console.log("Canceled successfully! Signature:", txSignature);
    return txSignature;
  } catch (error) {
    console.error("Error canceling:", error);
    throw error;
  }
};

// Fetch all plans created by a specific merchant
export const fetchMerchantPlans = async (
  program: Program<Biller>,
  merchantPubkey: PublicKey
): Promise<SubscriptionPlan[]> => {
   
  if (!program) return [];
  
  const allPlans = await program.account.subscriptionPlan.all();
  
  const merchantPlans = allPlans.filter(
    (p) => p.account.merchant.toBase58() === merchantPubkey.toBase58()
  );
  
  return merchantPlans.map((p) => ({
    publicKey: p.publicKey.toBase58(),
    merchant: p.account.merchant.toBase58(),
    price: p.account.price.toNumber() / 1e6,
    billingCycleSeconds: p.account.billingCycleSeconds.toNumber(),
    isActive: p.account.isActive,
    createdAt: p.account.createdAt.toNumber() * 1000,
    mint: p.account.mint.toBase58(),
    planId: p.account.planId
  }));
};

// Fetch all  subscriptions for a specific user
export const fetchUserSubscriptions = async (
  program: Program<Biller>,
  subscriberPubkey: PublicKey
): Promise<Subscription[]> => {
  if (!program) return [];
  const allSubs = await program.account.subscription.all();
  
  const userSubs = allSubs.filter(
    (s) => s.account.subscriber.toBase58() === subscriberPubkey.toBase58()
  );
  
  return userSubs.map((s) => ({
    publicKey: s.publicKey.toBase58(),
    subscriber: s.account.subscriber.toBase58(),
    plan: s.account.plan.toBase58(),
    vault: s.account.vault.toBase58(),
    nextBillingAt: s.account.nextBillingAt.toNumber() * 1000,
    lastBilledAt: s.account.lastBilledAt.toNumber() * 1000,
    totalPaid: s.account.totalPaid.toNumber() / 1e6,
    failedAttempts: s.account.failedAttempts,
    isActive: s.account.isActive,
    createdAt: s.account.createdAt.toNumber() * 1000,
    pausedAt: s.account.pausedAt.toNumber() * 1000,
    bump: s.account.bump,
  }));
};

export const checkSubscriberBalance = async (
  connection: Connection,
  subscriberAta: PublicKey,
  requiredAmountUi: number
) => {
  try {
    const balance = await connection.getTokenAccountBalance(subscriberAta);
    if (balance.value.uiAmount === null || balance.value.uiAmount < requiredAmountUi) {
      throw new Error(`Insufficient funds. You need at least ${requiredAmountUi} USDC.`);
    }
  } catch (e: any) {
    if (e.message.includes("could not find account") || e.name === "TokenAccountNotFoundError") {
      throw new Error("USDC account not found or empty. Please fund your wallet with USDC first.");
    }
    throw e;
  }
};


export const topUpAndResume = async (
  program: Program<Biller>,
  subscriberPubkey: PublicKey,
  merchantPubkey: PublicKey,
  planId: string,
  depositUi: number
): Promise<TransactionSignature> => {
  try {
    const provider = program.provider as AnchorProvider;
    const connection = provider.connection;

    const subscriberAta = getAssociatedTokenAddressSync(DEVNET_TOKEN_MINT, subscriberPubkey);
    
    await checkSubscriberBalance(connection, subscriberAta, depositUi);

    const [planPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("plan"), merchantPubkey.toBuffer(), Buffer.from(planId)],
      program.programId
    );

    const [subsPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("subscription"), subscriberPubkey.toBuffer(), planPda.toBuffer()],
      program.programId
    );

    const vaultAta = getAssociatedTokenAddressSync(DEVNET_TOKEN_MINT, subsPda, true);
    const merchantAta = getAssociatedTokenAddressSync(DEVNET_TOKEN_MINT, merchantPubkey);

    const tx = new Transaction();

    // 1. SPL Transfer (Deposit Funds)
    tx.add(
      createTransferCheckedInstruction(
        subscriberAta,
        DEVNET_TOKEN_MINT,
        vaultAta,
        subscriberPubkey,
        depositUi * 1e6, // Amount to deposit
        6 // Decimals
      )
    );

    // 2. Unpause (Toggle)
    tx.add(
      await program.methods
        .toggleSubscription()
        .accountsStrict({
          signer: subscriberPubkey,
          plan: planPda,
          subscription: subsPda,
        })
        .instruction()
    );

    // 3. Manual Crank (Bill)
    tx.add(
      await program.methods
        .processBilling()
        .accountsStrict({
          cranker: subscriberPubkey, // Subscriber acts as their own cranker!
          plan: planPda,
          subscription: subsPda,
          vault: vaultAta,
          merchantAta: merchantAta,
          merchant: merchantPubkey,
          subscriber: subscriberPubkey,
          tokenMint: DEVNET_TOKEN_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction()
    );

    const txSignature = await provider.sendAndConfirm(tx);
    return txSignature;
  } catch (error) {
    throw error;
  }
};

export const addFundsToVault = async (
  program: Program<Biller>,
  subscriberPubkey: PublicKey,
  vaultPubkey: PublicKey,
  amountUi: number
): Promise<TransactionSignature> => {
  const provider = program.provider as AnchorProvider;
  const subscriberAta = getAssociatedTokenAddressSync(DEVNET_TOKEN_MINT, subscriberPubkey);
  
  await checkSubscriberBalance(provider.connection, subscriberAta, amountUi);

  const tx = new Transaction().add(
    createTransferCheckedInstruction(
      subscriberAta,
      DEVNET_TOKEN_MINT,
      vaultPubkey,
      subscriberPubkey,
      amountUi * 1e6, // 6 decimals
      6
    )
  );

  return await provider.sendAndConfirm(tx);
};