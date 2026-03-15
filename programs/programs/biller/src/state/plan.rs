use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct SubscriptionPlan {
    pub merchant: Pubkey,
    pub price: u64, //in lamports 
    pub billing_cycle_seconds: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub mint:Pubkey,
    #[max_len(32)] // reserve 4 bytes(for string length) + 32 bytes for this String
    pub plan_id: String,
}