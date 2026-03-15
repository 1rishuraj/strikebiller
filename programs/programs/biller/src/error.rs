use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Wrong Merchant")]
    Unauthorized,
    #[msg("Wrong Subscriber")]
    UnauthorizedUser,
    #[msg("Billing Cycle isn't due")]
    BillingCycleNotDue,
    #[msg("Subscription is Inactive")]
    SubscriptionInactive,
    #[msg("Insufficient Funds in vault")]
    InsufficientFunds,
    #[msg("Access Unauthorized")]
    UnauthorizedAccess,
    #[msg("Invalid Token Mint")]
    InvalidMint
}
