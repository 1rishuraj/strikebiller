use crate::{
    error::ErrorCode,
    state::{Subscription, SubscriptionPlan},
};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, close_account, Mint, TokenAccount, TokenInterface, TransferChecked, CloseAccount
};

#[derive(Accounts)]
pub struct Cancelling<'info> {
    #[account(
        address = subscription.plan,
    )]
    pub plan: Account<'info, SubscriptionPlan>, 
    
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = subscription,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    
    #[account(
        mut,
        close = subscriber, 
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
        associated_token::authority = subscriber,
        associated_token::token_program = token_program
    )]
    pub subscriber_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub subscriber: Signer<'info>,
    #[account(address = plan.mint @ ErrorCode::InvalidMint)]
    pub token_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[allow(unused_variables)]
impl<'info> Cancelling<'info> {
    pub fn lets_cancel(&mut self) -> Result<()> {
        let subscriber_key = self.subscription.subscriber;
        let plan_key = self.subscription.plan;
        let bump = self.subscription.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"subscription",
            subscriber_key.as_ref(),
            plan_key.as_ref(),
            &[bump],
        ]];

        //remaining tokens from the vault back to the user
        let transfer_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.token_mint.to_account_info(),
            to: self.subscriber_ata.to_account_info(),
            authority: self.subscription.to_account_info(),
        };

        let transfer_cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            transfer_accounts,
            signer_seeds
        );

        transfer_checked(transfer_cpi_ctx, self.vault.amount, self.token_mint.decimals)?;

        // Close the Vault token account 
        let close_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.subscriber.to_account_info(), 
            authority: self.subscription.to_account_info(),
        };
        
        let close_cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            close_accounts,
            signer_seeds
        );
        
        close_account(close_cpi_ctx)?;

        Ok(())
    }
}