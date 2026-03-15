"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const anchor_1 = require("@coral-xyz/anchor");
const spl_token_1 = require("@solana/spl-token");
const biller_json_1 = __importDefault(require("./idl/biller.json"));
const fs = __importStar(require("fs"));
const CRANKER_KEYPAIR_PATH = './cranker-keypair.json';
let cranker;
if (fs.existsSync(CRANKER_KEYPAIR_PATH)) {
    cranker = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(CRANKER_KEYPAIR_PATH, 'utf8'))));
    console.log(`✅ Loaded cranker: ${cranker.publicKey.toBase58()}`);
}
else {
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
const program = new anchor_1.Program(biller_json_1.default, provider);
//blling
const BillAllSubscriptions = (program) => __awaiter(void 0, void 0, void 0, function* () {
    if (!program)
        return;
    const transactions = yield program.account.subscription.all();
    const nowUnix = Math.floor(Date.now() / 1000); // Converted to seconds!
    const tobill = transactions.filter((tx) => {
        // Correct BN to Number conversion and Time comparison
        return tx.account.isActive && tx.account.nextBillingAt.toNumber() <= nowUnix;
    });
    console.log(`🔍 Found ${tobill.length} subscriptions due for billing.`);
    //for...of processes sequentially: without overlaps
    for (const sub of tobill) {
        try {
            const planAcc = yield program.account.subscriptionPlan.fetch(sub.account.plan);
            const merchATA = (0, spl_token_1.getAssociatedTokenAddressSync)(planAcc.mint, planAcc.merchant, true);
            const tx = yield program.methods
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
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            })
                .signers([cranker])
                .rpc();
            const updatedSub = yield program.account.subscription.fetch(sub.publicKey);
            // Check what actually happened on-chain
            if (updatedSub.isActive === false) {
                console.log(`⏸️  Subscriber ${sub.account.subscriber.toBase58()} was HARD PAUSED (Strike 3/3). TX: ${tx}`);
            }
            else if (updatedSub.failedAttempts > 0) {
                console.log(`⚠️  Insufficient funds! Subscriber ${sub.account.subscriber.toBase58()} hit Strike ${updatedSub.failedAttempts}/3. TX: ${tx}`);
            }
            else {
                console.log(`✅ Payment successful for ${sub.account.subscriber.toBase58()}! \nNext bill at: ${new Date(updatedSub.nextBillingAt.toNumber() * 1000).toLocaleString()}. \nTX: ${tx}`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to send transaction for ${sub.publicKey.toBase58()}`, error);
        }
    }
});
function runBillingCycle() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`\n[${new Date().toISOString()}] 🤖 Cranker waking up...`);
        try {
            yield BillAllSubscriptions(program);
            console.log("💤 Billing cycle complete. Going back to sleep.");
        }
        catch (error) {
            console.error("❌ Error during billing cycle:", error);
        }
    });
}
function startBot() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🚀 Initializing Cranker Bot...");
        try {
            yield provider.connection.requestAirdrop(cranker.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
            console.log("💧 Airdrop successful.");
        }
        catch (e) {
            console.log("⚠️ Airdrop failed (Devnet might be rate limiting). Proceeding anyway...");
        }
        // Run immediately, then set interval every 10 sec
        yield runBillingCycle();
        setInterval(runBillingCycle, 10 * 1000);
    });
}
startBot();
