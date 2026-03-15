use crate::{
    error::ErrorCode,
    state::{Subscription, SubscriptionPlan},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

#[derive(Accounts)]
pub struct Billing<'info> {
    #[account(mut)]
    pub cranker: Signer<'info>,

    #[account(
        address = subscription.plan,
        has_one = merchant //Enforces plan.merchant == merchant.key()
    )]
    pub plan: Account<'info, SubscriptionPlan>,
    #[account(
        mut,
        seeds=[b"subscription", subscriber.key().as_ref(), plan.key().as_ref()],
        bump,
        has_one = subscriber, 
        has_one = plan,
        has_one = vault
    )]
    pub subscription: Account<'info, Subscription>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = subscription,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = merchant,
        associated_token::token_program = token_program
    )]
    pub merchant_ata: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: For PDA derivation
    pub merchant: UncheckedAccount<'info>,
    /// CHECK: For PDA derivation
    pub subscriber: UncheckedAccount<'info>,
    #[account(address = plan.mint @ ErrorCode::InvalidMint)]
    pub token_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[allow(unused_variables)]
impl<'info> Billing<'info> {
    pub fn lets_bill(&mut self) -> Result<()> {
        let clock = Clock::get()?;
        require!(
            // Now -> 1 month passed so pay
            clock.unix_timestamp >= self.subscription.next_billing_at,
            ErrorCode::BillingCycleNotDue
        );

        require!(
            self.subscription.is_active && self.plan.is_active,
            ErrorCode::SubscriptionInactive
        );

        let vault_balance = self.vault.amount;
        if vault_balance >= self.plan.price {
            
            let transfer_accounts = TransferChecked {
                from: self.vault.to_account_info(),
                mint: self.token_mint.to_account_info(),
                to: self.merchant_ata.to_account_info(),
                authority: self.subscription.to_account_info(),
            };

            let subscriber_key = self.subscription.subscriber;
            let plan_key = self.subscription.plan;
            let bump = self.subscription.bump;
            let signer_seeds: &[&[&[u8]]] = &[&[
                b"subscription",
                subscriber_key.as_ref(),
                plan_key.as_ref(),
                &[bump],
            ]];
            let tranfer_cpi_ctx = CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                transfer_accounts,
                signer_seeds,
            );

            transfer_checked(tranfer_cpi_ctx, self.plan.price, self.token_mint.decimals)?;

            self.subscription.next_billing_at = clock
                .unix_timestamp
                .saturating_add(self.plan.billing_cycle_seconds as i64);

            self.subscription.last_billed_at = clock.unix_timestamp;
            self.subscription.total_paid = self.subscription.total_paid.saturating_add(self.plan.price);
            self.subscription.failed_attempts = 0;
            
        } else {
            
            self.subscription.failed_attempts = self.subscription.failed_attempts.saturating_add(1);
            
            if self.subscription.failed_attempts >= 3 {
                self.subscription.is_active = false;
                self.subscription.paused_at = clock.unix_timestamp;
            }
        }
        
        Ok(()) 

    }
}

