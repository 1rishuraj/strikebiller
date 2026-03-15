# ⚡ StrikeBiller: Decentralized Subscription Billing System

**Live Web3 App:** [strikebiller.vercel.app](https://strikebiller.vercel.app/)

**GitHub Repository:** [1rishuraj/strikebiller](https://github.com/1rishuraj/strikebiller/tree/main)

**Devnet Program ID:** `DJPman6YhQpGAFp3PkLXjqcf6fXrdVrwmrjve7odk8j`

**Pattern:** Subscription Billing System & Escrow Engine

**Video Demo:** [HERE](https://drive.google.com/file/d/1juVWU35RjWTSPJQzzDDFxRmmIFqjzn6Z/view)

---

## 🏛 Architecture Analysis: Web2 Backends vs. Solana State Machines

### 1. How Subscription Billing Works in Web2
In a traditional SaaS architecture (e.g., Node.js + PostgreSQL + Stripe):
* **State Storage:** User status (`is_active`, `next_billing_date`) is stored in a centralized database row.
* **Execution (Active Cron Jobs):** A backend server runs a continuous background cron job. When a billing date arrives, the server actively triggers an API call to a payment processor to charge a saved credit card.
* **Trust Model:** The user surrenders their payment details to the merchant. The user must blindly trust that the merchant will not overcharge them, double-bill them, or shut down operations after taking a 30-day upfront payment.

### 2. How StrikeBiller Works on Solana
StrikeBiller reframes Solana as a **distributed, lazy state-machine backend**.
* **State Storage (PDAs):** The traditional database is replaced by Program Derived Addresses (PDAs). `SubscriptionPlan` and `Subscription` states are publicly verifiable bytes on the ledger.
* **Trustless Escrow Vaults:** Instead of trusting a merchant with a credit card, the subscriber locks their USDC into an isolated Vault ATA (owned by the `Subscription` PDA). The merchant can only claim funds *after* the time has elapsed. 
* **Lazy Execution (The Cranker Bot):** Solana smart contracts cannot "wake themselves up" like Web2 cron jobs. They are passive. To solve this, StrikeBiller uses an off-chain "Cranker" bot (Node.js). The bot queries the blockchain for subscriptions where `next_billing_at` is in the past, and submits a `process_billing` transaction.
* **The Contract is the Bouncer:** The cranker bot has no administrative power. When it calls `process_billing`, the Rust program acts as the ultimate authority. It checks `Clock::get()?.unix_timestamp` and physically blocks the transaction if the bill is not legitimately due.
* **Strike System & Atomic Bundling:** If a vault is empty, the contract issues "Strikes". At 3 strikes, the account is hard-paused. Users can execute an atomic "Top Up & Resume" bundle to instantly refill the vault, unpause, and reset their billing timeline relative to the paused duration.
* **Instant Cancellation & Guaranteed Refunds:** Unlike Web2 where users must trust a company to honor a cancellation and stop future charges, StrikeBiller users maintain absolute sovereignty. Calling the `cancel_subscription` instruction instantly tears down the `Subscription` PDA, closes the Vault ATA, and refunds all unbilled USDC directly back to the user's wallet.

### 3. Tradeoffs & Constraints
* **Storage Costs (Rent):** Storing subscription state in a Web2 database is practically free. On Solana, allocating bytes for the `Subscription` and `Plan` PDAs requires a small amount of SOL for rent exemption.
* **Clock Drift:** Because the decentralized Solana network cluster calculates time slightly differently than a local server clock, the off-chain Cranker bot must account for slight network drift, otherwise the Rust contract will reject the transaction with a `BillingCycleNotDue` error.
* **Execution Centralization:** Currently, the cranker bot is a centralized Node.js script. If the script crashes, automated billing stops. However, because the smart contract is permissionless, *anyone* (even the user or a decentralized oracle network like Clockwork/Switchboard) can manually sign the cranker transaction to push the state machine forward.

---

## 📂 Repository Structure
This monorepo contains the complete lifecycle of the billing engine:
* `/programs` - The Anchor Rust smart contract (Backend State Machine).
* `/frontend` - The Next.js Web3 client (Deployed on Vercel).
* `/cranker` - The Node.js daemon worker for processing lazy execution.

### How to Test Locally
1. **Frontend:** Navigate to `/frontend` -> `npm install` -> `npm run dev`.
2. **Cranker Bot:** Navigate to `/cranker` -> `npm install` -> `npx ts-node src/index.ts`.
3. **Rust Tests:** Navigate to `/programs` -> run `anchor test` to verify all escrow constraints and state transitions.

*(Note: The live frontend requires Devnet USDC. Mint: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`)*

---

## 🔗 Live Devnet Proof

Below is the complete, sequential transaction history proving the lifecycle of the system on Devnet. 

**Actors & Tokens**
* Merchant Wallet: [`A5czjgBJ4Wqnexyxy2K2NDhiwz8LqJsV5Wd921tUw9yz`](https://explorer.solana.com/address/A5czjgBJ4Wqnexyxy2K2NDhiwz8LqJsV5Wd921tUw9yz?cluster=devnet)
* Subscriber Wallet: [`FyFwjP4gqdzgRxwv3sMYGJ9yYvYYvgU1RN3xZgh5ubvt`](https://explorer.solana.com/address/FyFwjP4gqdzgRxwv3sMYGJ9yYvYYvgU1RN3xZgh5ubvt?cluster=devnet)
* Program Deployment: [`5bQLebEeuxQBiCbZYGfwRbdtHVP72nJkwZvcB22gx5TRjryLzggwT2xNcGcxokxMxYpZnrQbS4mnKmbgzZbrQquV`](https://explorer.solana.com/tx/5bQLebEeuxQBiCbZYGfwRbdtHVP72nJkwZvcB22gx5TRjryLzggwT2xNcGcxokxMxYpZnrQbS4mnKmbgzZbrQquV?cluster=devnet)

**1. Initialization & Subscription Flow**
* Initialize "Pro Plan" (Merchant): [`3unP88Y...`](https://explorer.solana.com/tx/3unP88YThLgypx5SD6FKa6WqSrZ7K94zqR3QU6hCGkCSaYcfm4Hkq5hbT5ZxEwgCUoyRuzYkU2gQb5ELcnVEeFPu?cluster=devnet)
* Subscribe & Lock Escrow Funds (Subscriber): [`3QLEgNG...`](https://explorer.solana.com/tx/3QLEgNGRvAZY2aPM4mmac1jTmKj4zym93KWTcGvLcYpE8TFYwN5SYVbSBZB2vgPLbAo6TvtfK5RJcg4g2cXAD9eV?cluster=devnet)

**2. Lazy Execution (The Cranker Bot)**
* Cranker Successfully Bills Subscription: [`2vgNET2...`](https://explorer.solana.com/tx/2vgNET2u1ZxFkqCN2MMuo7kg9MZAtQs86utTKqTL6cEk758DEMQgoo8wWtk85uSYcVzuABf3yr1QPMs8ah1cBFX8?cluster=devnet)
* Cranker Issues 3 Strikes for Empty Vault & Pauses:
  * Strike 1: [`4fWSVh7...`](https://explorer.solana.com/tx/4fWSVh7XtD7cLmKV7B95uTSrEqPNWr3TrtdWdu8tNmEXqTW25C9YxMXJjMav3H5NDJmXskUiFcnbWDX5WnsZ7eXP?cluster=devnet)
  * Strike 2: [`3Ppfu8F...`](https://explorer.solana.com/tx/3Ppfu8FDj97rT2PtiPpA5tRsshJ4fnbKzE7pVtw2W115Cp8BmwVmMKjvnRT9161XP3gn4h25j92BiTbRsq5HmYFZ?cluster=devnet)
  * Strike 3 (Hard Pause): [`4pEozzj...`](https://explorer.solana.com/tx/4pEozzjAdRRCsWjw8RbGB77JHsXTGfEHTKhDbZzdCjHwThcqxY1Wak8npa74su7vBhzBcjQnAneUH8iNBk4JejS3?cluster=devnet)

**3. State Toggling & Cancellation**
* Manual Pause (Vacation Mode): [`3Yy7zvq...`](https://explorer.solana.com/tx/3Yy7zvqEWhzeCzmDZGek2i5PrMQLAjLKoArabqjcaZTctxDvhoYKMXaCqX1jqwvtKovGbYBrH5bjpYTA95zVtC1b?cluster=devnet)
* Manual Resume: [`2PMB4XF...`](https://explorer.solana.com/tx/2PMB4XFGDB7QbeRgrkJ3vtw1R8Ak1nRyrxyiGyqZ4W9rk9CffdVJ3ADjn3gJG4pxFrHsux5y3trzNaohB4QmRnEe?cluster=devnet)
* Cancel Subscription & Refund Remaining Escrow: [`3gNX5PS...`](https://explorer.solana.com/tx/3gNX5PStLHn6L6sY7n69RjmipUpqeGkv7Bq1qHYcMxX5jRwfzuhZgHgXXVxz5CF7ssYFzHpFFE1mWJrmXcbiKBhm?cluster=devnet)

**4. Additional Flow Testing**
* Initialize "Basic Plan": [`MSYoGyu...`](https://explorer.solana.com/tx/MSYoGyuDncYieWBdxz2aHS7pX9Jg54Nrnp69FqXx3bp7BNiqG2zQFVy98aYUXbeiXTjbtFMEmXyrDmVN8qCan3g?cluster=devnet)
* Subscribe to "Basic Plan": [`2hRtt97...`](https://explorer.solana.com/tx/2hRtt97rkg2TrGactXH4bJnoCmzY1i5kDcpjUwRpJXVKcDorcAroB3vpvQzGw37FYQdsUDHmAru8fwmmsJv4uGFM?cluster=devnet)
