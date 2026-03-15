import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Biller } from "../target/types/biller";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMint,
  getAssociatedTokenAddressSync,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";
import { before } from "mocha";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
// import don from './subDON.json'
// import me from './subDON.json'

enum Plan {
  Basic = "Basic",
  Pro = "Pro",
}

async function ensureAtaExists(
  provider: anchor.AnchorProvider,
  mint: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
) {
  const ata = getAssociatedTokenAddressSync(mint, owner, true);
  const info = await provider.connection.getAccountInfo(ata);

  if (!info) {
    const tx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        ata,
        owner,
        mint,
      ),
    );

    // Anchor's provider automatically signs with default wallet!
    await provider.sendAndConfirm(tx);
    console.log(`ATA created: ${ata.toBase58()}\n`);

    await mintTo(
      provider.connection,
      provider.wallet.payer, // payer
      mint,
      ata,
      provider.wallet.payer, // Mint Authority 
      5000 * 1e6, // 5000 fake USDC tokens
    );
  }
  return ata;
}

describe("biller", () => {
  // Configuring client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.biller as Program<Biller>;
  
  let plan: anchor.web3.PublicKey;
  let subs: anchor.web3.PublicKey;
  let merchant = provider.wallet.payer;
  let merchantATA: anchor.web3.PublicKey;
  // let subscriber = anchor.web3.Keypair.fromSecretKey(new Uint8Array(don))
  let subscriber = anchor.web3.Keypair.generate()
  let subscriberATA: anchor.web3.PublicKey;
  let vaultATA: anchor.web3.PublicKey;
  let token_mint: anchor.web3.PublicKey;
  const token_program = TOKEN_PROGRAM_ID;
  const associated_token_program = ASSOCIATED_TOKEN_PROGRAM_ID;
  const system_program = SYSTEM_PROGRAM_ID;
  let price: number = 2 * 1e6,
    billing_cycle_seconds = 3; //for 3 sec
  let plan_id: Plan = Plan.Pro;

  before(async () => {
    //  Airdrop SOL to subscriber
    await provider.connection.requestAirdrop(
      subscriber.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL,
    );

    //fake mint
    token_mint = await createMint(
      provider.connection,
      merchant, // Payer
      merchant.publicKey, // Mint Authority
      null, // Freeze Authority
      6, // 6 Decimals (like USDC)
    );
    // token_mint = new anchor.web3.PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr")
    console.log(`\nTest Token Created on Devnet: ${token_mint.toBase58()}`);
  });

  it("Is Subscription Plan initialized!", async () => {
    //airdrop
    await provider.connection.requestAirdrop(
      merchant.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL,
    );
    //derive PDAs
    let planBump: number;
    [plan, planBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("plan"),
        merchant.publicKey.toBuffer(),
        Buffer.from(plan_id),
      ],
      program.programId,
    );

    // Add your test here.
    const tx = await program.methods
      .initializePlan(
        plan_id,
        new anchor.BN(price),
        new anchor.BN(billing_cycle_seconds),
      )
      .accountsStrict({
        plan,
        merchant: merchant.publicKey,
        tokenMint: token_mint,
        systemProgram: system_program,
      })
      .rpc();
    console.log("\ntransaction signature :", tx);
    const planAcc = await program.account.subscriptionPlan.fetch(plan);
    expect(planAcc.merchant.toBase58()).to.equal(merchant.publicKey.toBase58());
    expect(planAcc.price.toNumber()).to.equal(price);
    expect(planAcc.billingCycleSeconds.toNumber()).to.equal(
      billing_cycle_seconds,
    );
    expect(planAcc.mint.toBase58()).to.equal(token_mint.toBase58());
    expect(planAcc.isActive).to.equal(true);
    // Convert BN to number and compare in milliseconds
    const timestampMillis = planAcc.createdAt.toNumber() * 1000;
    expect(timestampMillis).to.be.closeTo(Date.now(), 10000); //close to past 10 sec
  });

  it("Can a subscriber create subscription for the plan!", async () => {
    //airdrop
    await provider.connection.requestAirdrop(
      subscriber.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL,
    );
    //derive PDAs

    let subsBump: number;
    [subs, subsBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("subscription"),
        subscriber.publicKey.toBuffer(),
        plan.toBuffer(),
      ],
      program.programId,
    );
    //ata
    subscriberATA = await ensureAtaExists(
      provider,
      token_mint,
      subscriber.publicKey,
    );

    // as contract creates it:
    vaultATA = getAssociatedTokenAddressSync(token_mint, subs, true);
    //amt to be saved in vault
    let amt = 2 * 1e6; //in USDC base units
    const subsATAbefore = (
      await provider.connection.getTokenAccountBalance(subscriberATA)
    ).value.uiAmount;
    // Add your test here.
    const tx = await program.methods
      .subscribe(new anchor.BN(amt))
      .accountsStrict({
        plan,
        subscription: subs,
        subscriber: subscriber.publicKey,
        subscriberAta: subscriberATA,
        vault: vaultATA,
        tokenMint: token_mint,
        tokenProgram: token_program,
        associatedTokenProgram: associated_token_program,
        systemProgram: system_program,
      })
      .signers([subscriber])
      .rpc();
    console.log("\ntransaction signature :", tx);
    const subsAcc = await program.account.subscription.fetch(subs);
    expect(subsAcc.subscriber.toBase58()).to.equal(
      subscriber.publicKey.toBase58(),
    );
    expect(subsAcc.plan.toBase58()).to.equal(plan.toBase58());
    expect(subsAcc.vault.toBase58()).to.equal(vaultATA.toBase58());
    const nowUnix = Math.floor(Date.now() / 1000); // Current time in seconds
    // in the last 10 seconds?
    expect(subsAcc.createdAt.toNumber()).to.be.closeTo(nowUnix, 10);
    //Is next billing exactly (created_at + 3 seconds)?
    expect(subsAcc.nextBillingAt.toNumber()).to.equal(
      subsAcc.createdAt.toNumber() + billing_cycle_seconds,
    );
    expect(subsAcc.lastBilledAt.toNumber()).to.equal(
      subsAcc.createdAt.toNumber(),
    );
    expect(subsAcc.totalPaid.toNumber()).to.equal(0);
    expect(subsAcc.failedAttempts).to.equal(0);
    expect(subsAcc.isActive).to.equal(true);
    expect(subsAcc.pausedAt.toNumber()).to.equal(0);
    expect(subsAcc.bump).to.equal(subsBump);
    const subsATAafter = (
      await provider.connection.getTokenAccountBalance(subscriberATA)
    ).value.uiAmount;
    const vaultATAafter = (
      await provider.connection.getTokenAccountBalance(vaultATA)
    ).value.amount;
    expect(vaultATAafter).to.equal(amt.toString()); 
    expect(subsATAafter).to.equal(subsATAbefore - amt / 1e6);
  });

  it("Can cranker bill the subscription at billing time!", async () => {
    //airdrop
     // let cranker = anchor.web3.Keypair.fromSecretKey(new Uint8Array(me))
    let cranker = anchor.web3.Keypair.generate()
    await provider.connection.requestAirdrop(
      cranker.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL,
    );
    // Wait for the blockchain clock to pass `next_billing_at`
    console.log(
      "    ⏳ Waiting 4 seconds for the billing cycle to become due...",
    );
    await new Promise((resolve) => setTimeout(resolve, 4000));
    //derive PDAs

    //ata
    merchantATA = await ensureAtaExists(
      provider,
      token_mint,
      merchant.publicKey,
    );

    const vaultATAbefore = Number(
      (await provider.connection.getTokenAccountBalance(vaultATA)).value.amount,
    );
    const merchantATAbefore = Number(
      (await provider.connection.getTokenAccountBalance(merchantATA)).value
        .amount,
    );
    // Add your test here.
    const tx = await program.methods
      .processBilling()
      .accountsStrict({
        cranker: cranker.publicKey,
        plan,
        subscription: subs,
        subscriber: subscriber.publicKey,
        vault: vaultATA,
        merchantAta: merchantATA,
        merchant: merchant.publicKey,
        tokenMint: token_mint,
        tokenProgram: token_program,
      })
      .signers([cranker])
      .rpc();
    console.log("\ntransaction signature :", tx);
    const vaultATAafter = Number(
      (await provider.connection.getTokenAccountBalance(vaultATA)).value.amount,
    );
    const merchantATAafter = Number(
      (await provider.connection.getTokenAccountBalance(merchantATA)).value
        .amount,
    );
    const subsAcc = await program.account.subscription.fetch(subs);

    expect(vaultATAafter).to.equal(vaultATAbefore - price);
    expect(merchantATAafter).to.equal(merchantATAbefore + price);
    const nowUnix = Math.floor(Date.now() / 1000); // Current time in seconds
    // in the last 10 seconds?
    expect(subsAcc.lastBilledAt.toNumber()).to.be.closeTo(nowUnix, 10);
    //Is next billing exactly (last_billed_at + 3 seconds)?
    expect(subsAcc.nextBillingAt.toNumber()).to.equal(
      subsAcc.lastBilledAt.toNumber() + billing_cycle_seconds,
    );
    expect(subsAcc.totalPaid.toNumber()).to.equal(price);
    expect(subsAcc.failedAttempts).to.equal(0);
  });

  it("Can handle billing when the vault has insufficient funds!  attempt (strike 1/3)", async () => {
    //airdrop
    // let cranker = anchor.web3.Keypair.fromSecretKey(new Uint8Array(me))
    let cranker = anchor.web3.Keypair.generate()
    await provider.connection.requestAirdrop(
      cranker.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL,
    );

    // Wait for the next billing cycle to trigger the deficit check
    console.log("    ⏳ Waiting 4 seconds for the next cycle...");
    await new Promise((resolve) => setTimeout(resolve, 4000));

    //ata

    // passing empty vaultATA as had funds for once only

    let tx = await program.methods
      .processBilling()
      .accountsStrict({
        cranker: cranker.publicKey,
        plan,
        subscription: subs,
        vault: vaultATA,
        merchantAta: merchantATA,
        merchant: merchant.publicKey,
        subscriber: subscriber.publicKey,
        tokenMint: token_mint,
        tokenProgram: token_program,
      })
      .signers([cranker])
      .rpc();

    let subsAcc = await program.account.subscription.fetch(subs);
    
    expect(subsAcc.failedAttempts).to.equal(1); // Strike 1!
    expect(subsAcc.isActive).to.equal(true); // Still active until 3 strikes
  });

  it("Can handle billing when the vault has insufficient funds! attempt (strike 2/3)", async () => {
    //airdrop
     // let cranker = anchor.web3.Keypair.fromSecretKey(new Uint8Array(me))
    let cranker = anchor.web3.Keypair.generate()
    await provider.connection.requestAirdrop(
      cranker.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL,
    );

    //ata

    // passing empty vaultATA as had funds for once only

    let tx = await program.methods
      .processBilling()
      .accountsStrict({
        cranker: cranker.publicKey,
        plan,
        subscription: subs,
        vault: vaultATA,
        merchantAta: merchantATA,
        merchant: merchant.publicKey,
        subscriber: subscriber.publicKey,
        tokenMint: token_mint,
        tokenProgram: token_program,
      })
      .signers([cranker])
      .rpc();

    let subsAcc = await program.account.subscription.fetch(subs);
    
    expect(subsAcc.failedAttempts).to.equal(2); // Strike 1!
    expect(subsAcc.isActive).to.equal(true); // Still active until 3 strikes

  });

  it("Pauses subscription after 3 failed payments attempt (strike 3/3)", async () => {
    //airdrop
 // let cranker = anchor.web3.Keypair.fromSecretKey(new Uint8Array(me))
    let cranker = anchor.web3.Keypair.generate()    
    await provider.connection.requestAirdrop(
      cranker.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL,
    );

    //ata

    // passing empty vaultATA as had funds for once only

    let tx = await program.methods
      .processBilling()
      .accountsStrict({
        cranker: cranker.publicKey,
        plan,
        subscription: subs,
        vault: vaultATA,
        merchantAta: merchantATA,
        merchant: merchant.publicKey,
        subscriber: subscriber.publicKey,
        tokenMint: token_mint,
        tokenProgram: token_program,
      })
      .signers([cranker])
      .rpc();

    let subsAcc = await program.account.subscription.fetch(subs);
    
    expect(subsAcc.failedAttempts).to.equal(3); // Strike 1!
    expect(subsAcc.isActive).to.equal(false); 
    const nowUnix = Math.floor(Date.now() / 1000); // Current time in seconds
    // in the last 10 seconds?
    expect(subsAcc.pausedAt.toNumber()).to.be.closeTo(nowUnix, 10);

  });
   
  it("Can subscriber/merchant cancel the subscription anytime", async () => {
    //airdrop

    //ata

    const vaultATAbefore = Number(
      (await provider.connection.getTokenAccountBalance(vaultATA)).value.amount,
    );
    const subsATAbefore = Number(
      (await provider.connection.getTokenAccountBalance(subscriberATA)).value
        .amount,
    );

    const subscriberBefore = (await provider.connection.getAccountInfo(subscriber.publicKey)).lamports
    const rent = await provider.connection.getMinimumBalanceForRentExemption(165)

    let tx = await program.methods
      .cancelSubscription()
      .accountsStrict({
        plan,
        vault:vaultATA,
        subscription: subs,
        subscriberAta:subscriberATA,
        subscriber: subscriber.publicKey,
        tokenMint: token_mint,
        tokenProgram: token_program,
      })
      .signers([subscriber])
      .rpc();

    const subsATAafter = Number(
      (await provider.connection.getTokenAccountBalance(subscriberATA)).value
        .amount,
    );
    const subscriberAfter = (await provider.connection.getAccountInfo(subscriber.publicKey)).lamports

    expect(subsATAafter).to.equal(subsATAbefore+vaultATAbefore); 
    expect(subscriberAfter).to.be.greaterThan(subscriberBefore);

  });

  let Subscriber : anchor.web3.Keypair;
  let SubscriberATA: anchor.web3.PublicKey;
  let Subs: anchor.web3.PublicKey;
  let SubsBump: number;
  let planPKEY:anchor.web3.PublicKey;
  let planBumpNo:number;


  it("Can subscriber/merchant pause the subscription anytime", async () => {
    Subscriber=subscriber;
    SubscriberATA=subscriberATA;

    let planID:Plan =Plan.Basic;

    [planPKEY, planBumpNo] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("plan"),
        merchant.publicKey.toBuffer(),
        Buffer.from(planID),
      ],
      program.programId,
    );

    const Tx = await program.methods
      .initializePlan(
        planID,
        new anchor.BN(1*1e6), // 1 USDC
        new anchor.BN(30), //30 sec
      )
      .accountsStrict({
        plan:planPKEY,
        merchant: merchant.publicKey,
        tokenMint: token_mint,
        systemProgram: system_program,
      })
      .rpc();
    console.log("\ntransaction signature :", Tx);
    //derive PDAs

    
     [Subs, SubsBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("subscription"),
        Subscriber.publicKey.toBuffer(),
        planPKEY.toBuffer(),
      ],
      program.programId,
    );
    //ata
    SubscriberATA = await ensureAtaExists(
      provider,
      token_mint,
      Subscriber.publicKey,
    );

    // as contract creates it:
    vaultATA = getAssociatedTokenAddressSync(token_mint, Subs, true);
    //amt to be saved in vault 
    let amt = 1 * 1e6; //in USDC base units
    const SubsATAbefore = (
      await provider.connection.getTokenAccountBalance(SubscriberATA)
    ).value.uiAmount;
    // Add your test here.
    const txx = await program.methods
      .subscribe(new anchor.BN(amt))
      .accountsStrict({
        plan:planPKEY,
        subscription: Subs,
        subscriber: Subscriber.publicKey,
        subscriberAta: SubscriberATA,
        vault: vaultATA,
        tokenMint: token_mint,
        tokenProgram: token_program,
        associatedTokenProgram: associated_token_program,
        systemProgram: system_program,
      })
      .signers([Subscriber])
      .rpc();
    console.log("\ntransaction signature :", txx);

    let tx = await program.methods
      .toggleSubscription()
      .accountsStrict({
        signer: Subscriber.publicKey,
        plan:planPKEY,
        subscription: Subs,
      })
      .signers([Subscriber])
      .rpc();

    let subsAcc = await program.account.subscription.fetch(Subs);
 
    expect(subsAcc.isActive).to.equal(false); 
    const nowUnix = Math.floor(Date.now() / 1000); // Current time in seconds
    // in the last 10 seconds?
    expect(subsAcc.pausedAt.toNumber()).to.be.closeTo(nowUnix, 10);

  });

  it("Can subscriber/merchant resume the subscription anytime", async () => {
    await new Promise(resolve => setTimeout(resolve, 3000))
    const subsAccBefore = await program.account.subscription.fetch(Subs);
    const oldNextBillingAt = subsAccBefore.nextBillingAt.toNumber();
    const pausedAt = subsAccBefore.pausedAt.toNumber();
    let tx = await program.methods
      .toggleSubscription()
      .accountsStrict({
        signer: Subscriber.publicKey,
        plan:planPKEY,
        subscription: Subs,
      })
      .signers([Subscriber])
      .rpc();

    let subsAccAfter = await program.account.subscription.fetch(Subs);

    const nowUnix = Math.floor(Date.now() / 1000);
    const expectedTimePaused = nowUnix - pausedAt; // How many seconds it was frozen
    const expectedNextBilling = oldNextBillingAt + expectedTimePaused;

    expect(subsAccAfter.isActive).to.equal(true);
    expect(subsAccAfter.pausedAt.toNumber()).to.equal(0);
    // closeTo (within ~3 seconds) to account for slight network clock drift
    expect(subsAccAfter.nextBillingAt.toNumber()).to.be.closeTo(expectedNextBilling, 3);
  });
});