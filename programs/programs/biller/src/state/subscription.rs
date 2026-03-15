use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Subscription {
    pub subscriber: Pubkey,
    pub plan: Pubkey,
    pub vault: Pubkey,
    pub next_billing_at: i64,
    pub last_billed_at: i64,
    pub total_paid: u64,
    pub failed_attempts: u8,
    pub is_active: bool,
    pub created_at: i64,
    pub paused_at:i64,
    pub bump: u8,
}