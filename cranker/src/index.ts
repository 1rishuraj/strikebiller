import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Biller } from "./types/biller";
import {
 
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import idl from "./idl/biller.json";
import * as fs from "fs";

const CRANKER_KEYPAIR_PATH = './cranker-keypair.json';
let cranker: anchor.web3.Keypair;
if (fs.existsSync(CRANKER_KEYPAIR_PATH)) {
  cranker = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(CRANKER_KEYPAIR_PATH, 'utf8')))
  );
  console.log(`✅ Loaded cranker: ${cranker.publicKey.toBase58()}`);
} else {
  // ONE-TIME setup only
  cranker = anchor.web3.Keypair.generate();
  fs.writeFileSync(CRANKER_KEYPAIR_PATH, JSON.stringify(Array.from(cranker.secretKey)));
  console.log(`🆕 Created cranker: ${cranker.publicKey.toBase58()}`);
  console.log('💾 SAVE THIS FILE SECURELY! Never regenerate.');
}
const wallet = new anchor.Wallet(cranker);

//connection
const connection = new anchor.web3.Connection("https://devnet.helius-rpc.com/?api-key=3c87c9f8-abe0-4a91-a0fa-bd20763737ce", "confirmed");
const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
anchor.setProvider(provider);
const program = new Program<Biller>(idl as Biller, provider);

//blling
const BillAllSubscriptions = async (program: Program<Biller>): Promise<void> => {
  if (!program) return;
  
  const transactions = await program.account.subscription.all();
  const nowUnix = Math.floor(Date.now() / 1000); // Converted to seconds!

  const tobill = transactions.filter((tx) => {
    // Correct BN to Number conversion and Time comparison
    return tx.account.isActive && tx.account.nextBillingAt.toNumber() <= nowUnix;
  });

  console.log(`🔍 Found ${tobill.length} subscriptions due for billing.`);

  //for...of processes sequentially: without overlaps
  for (const sub of tobill) {
    try {
      const planAcc = await program.account.subscriptionPlan.fetch(sub.account.plan);
      const merchATA = getAssociatedTokenAddressSync(planAcc.mint, planAcc.merchant, true);
      
      const tx = await program.methods
        .processBilling()
        .accountsStrict({
          cranker: cranker.publicKey,
          plan: sub.account.plan,
          subscription: sub.publicKey,
          subscriber: sub.account.subscriber,
          vault: sub.account.vault,
          merchantAta: merchATA,
          merchant: planAcc.merchant,
          tokenMint: planAcc.mint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([cranker])
        .rpc();
        
      const updatedSub = await program.account.subscription.fetch(sub.publicKey);
      
      // Check what actually happened on-chain
      if (updatedSub.isActive === false) {
          console.log(`⏸️  Subscriber ${sub.account.subscriber.toBase58()} was HARD PAUSED (Strike 3/3). TX: ${tx}`);
      } else if (updatedSub.failedAttempts > 0) {
          console.log(`⚠️  Insufficient funds! Subscriber ${sub.account.subscriber.toBase58()} hit Strike ${updatedSub.failedAttempts}/3. TX: ${tx}`);
      } else {
          console.log(`✅ Payment successful for ${sub.account.subscriber.toBase58()}! \nNext bill at: ${new Date(updatedSub.nextBillingAt.toNumber() * 1000).toLocaleString()}. \nTX: ${tx}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to send transaction for ${sub.publicKey.toBase58()}`, error);
    }
  }
}


async function runBillingCycle() {
  console.log(`\n[${new Date().toISOString()}] 🤖 Cranker waking up...`);
  try {
    await BillAllSubscriptions(program);
    console.log("💤 Billing cycle complete. Going back to sleep.");
  } catch (error) {
    console.error("❌ Error during billing cycle:", error);
  }
}

async function startBot() {
  console.log("🚀 Initializing Cranker Bot...");
  try {
    await provider.connection.requestAirdrop(cranker.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    console.log("💧 Airdrop successful.");
  } catch(e) {
    console.log("⚠️ Airdrop failed (Devnet might be rate limiting). Proceeding anyway...");
  }

  // Run immediately, then set interval every 10 sec
  await runBillingCycle();
  setInterval(runBillingCycle, 10 * 1000);
}

startBot();