use anchor_lang::prelude::*;
pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("DJPman6YhQpGAFp3PkLXjqcf6fXrdVrwmrjve7odk8j");

#[program]
pub mod biller {
    use super::*;

    pub fn initialize_plan(
        ctx: Context<InitializePlan>,
        plan_id:String,
        price: u64,
        billing_cycle_seconds: u64
        
    ) -> Result<()> {
        ctx.accounts.initialize_plan(plan_id, price, billing_cycle_seconds)
    }

    pub fn subscribe(
        ctx: Context<Subscribe>,
        amt:u64 //base units
        
    ) -> Result<()> {
        ctx.accounts.lets_subscribe(ctx.bumps,amt)
    }

    pub fn process_billing(ctx: Context<Billing>) -> Result<()> {
        ctx.accounts.lets_bill()
    }

    pub fn cancel_subscription(ctx: Context<Cancelling>) -> Result<()> {
        ctx.accounts.lets_cancel()
    }

    pub fn toggle_subscription(ctx: Context<ToggleSubscription>) -> Result<()> {
        ctx.accounts.toggle_active()
    }
}
