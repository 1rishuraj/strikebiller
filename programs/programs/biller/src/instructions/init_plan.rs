use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{Mint},
};
use crate::{state::SubscriptionPlan};

#[derive(Accounts)]
#[instruction(plan_id:String)]
pub struct InitializePlan<'info>{

    #[account(
        init,
        payer = merchant,
        space=8+SubscriptionPlan::INIT_SPACE,
        seeds=[b"plan", merchant.key().as_ref(), plan_id.as_bytes()],
        bump
    )]
    pub plan:Account<'info, SubscriptionPlan>,

    #[account(mut)]
    pub merchant:Signer<'info>,
    
    pub token_mint: InterfaceAccount<'info, Mint>,
    pub system_program:Program<'info, System>
}

#[allow(unused_variables)]
impl<'info> InitializePlan<'info>{
    pub fn initialize_plan(&mut self,plan_id:String, price:u64, bill_cycle_sec:u64)->Result<()>{
        self.plan.set_inner(SubscriptionPlan {
            merchant: self.merchant.key(),
            price, // of a month
            billing_cycle_seconds: bill_cycle_sec, //1 month
            mint: self.token_mint.key(),
            is_active: true, //If you decide to cancel your gym membership, you tear up your card (we close the Subscription PDA). But the gym does not instantly stop offering the Premium Monthly Membership to the rest of the world!(never inactive the PLAN PDA)
            created_at: Clock::get()?.unix_timestamp,
            plan_id
        });
        Ok(())
    }
}