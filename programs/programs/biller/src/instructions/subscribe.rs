use anchor_lang::prelude::*;
use anchor_spl::{
    
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked},
};
use crate::{error::ErrorCode,state::{Subscription, SubscriptionPlan}};

#[derive(Accounts)]
pub struct Subscribe<'info>{

    pub plan:Account<'info, SubscriptionPlan>,
    #[account(
        init,
        payer = subscriber,
        space=8+Subscription::INIT_SPACE,
        seeds=[b"subscription", subscriber.key().as_ref(), plan.key().as_ref()],
        bump
    )]
    pub subscription:Account<'info, Subscription>,
    #[account(mut)]
    pub subscriber:Signer<'info>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = subscriber,
        associated_token::token_program = token_program
    )]
    pub subscriber_ata:InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = subscriber,
        associated_token::mint = token_mint,
        associated_token::authority = subscription,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
   
    #[account(address = plan.mint @ ErrorCode::InvalidMint)]
    pub token_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:Program<'info, System>
}

#[allow(unused_variables)]

impl<'info> Subscribe<'info>{
    pub fn lets_subscribe(&mut self, bumps:SubscribeBumps, amount:u64 )->Result<()>{
        self.subscription.set_inner(Subscription {
            subscriber: self.subscriber.key(),
            plan: self.plan.key(),
            vault:self.vault.key(),
            next_billing_at: Clock::get()?.unix_timestamp.saturating_add(self.plan.billing_cycle_seconds as i64),
            last_billed_at:  Clock::get()?.unix_timestamp,
            total_paid: 0,
            failed_attempts: 0,
            is_active: true,
            created_at: Clock::get()?.unix_timestamp,
            paused_at: 0,
            bump: bumps.subscription
        });
        // Transfer the initial amt to the vault
        let transfer_accounts = TransferChecked {
            from: self.subscriber_ata.to_account_info(),
            mint: self.token_mint.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.subscriber.to_account_info(),
        };

        let tranfer_cpi_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            transfer_accounts
        );

        //amount in base units
        transfer_checked(tranfer_cpi_ctx, amount, self.token_mint.decimals)?;

        Ok(())
    }
}