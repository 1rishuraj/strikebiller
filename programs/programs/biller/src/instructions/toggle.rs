use crate::{
    state::{Subscription, SubscriptionPlan},
    error::ErrorCode, 
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ToggleSubscription<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, // Can be either subscriber or merchant

    #[account(
        address = subscription.plan,
    )]
    pub plan: Account<'info, SubscriptionPlan>,

    #[account(
        mut,
        seeds = [b"subscription", subscription.subscriber.as_ref(), plan.key().as_ref()],
        bump = subscription.bump,
        // SECURITY: Ensure the person signing is either the user who owns it, or the merchant who created the plan
        constraint = signer.key() == subscription.subscriber || signer.key() == plan.merchant @ ErrorCode::UnauthorizedAccess
    )]
    pub subscription: Account<'info, Subscription>,
   

}

#[allow(unused_variables)]
impl<'info> ToggleSubscription<'info> {
   pub fn toggle_active(&mut self) -> Result<()> {
        let clock = Clock::get()?;

        if self.subscription.is_active {
            self.subscription.is_active = false;
            self.subscription.paused_at = clock.unix_timestamp;
        } else {
            self.subscription.is_active = true;

            if self.subscription.paused_at > 0 {
                let time_paused = clock.unix_timestamp.saturating_sub(self.subscription.paused_at);

                self.subscription.next_billing_at = self.subscription.next_billing_at.saturating_add(time_paused);

                self.subscription.paused_at = 0;
            }
        }
        Ok(())
    }
}
