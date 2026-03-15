export interface SubscriptionPlan {
  publicKey: string
  merchant: string
  price: number
  billingCycleSeconds: number
  isActive: boolean
  createdAt: number
  mint: string
  planId: string
}

export interface Subscription {
  publicKey: string
  subscriber: string
  plan: string
  vault: string
  nextBillingAt: number
  lastBilledAt: number
  totalPaid: number
  failedAttempts: number
  isActive: boolean
  createdAt: number
  pausedAt: number
  bump: number
  vaultBalance?: number
}

export interface GlobalState {
  merchantPlans: SubscriptionPlan[]
  userSubscriptions: Subscription[]
  activePlan: SubscriptionPlan | null
  activeSubscription: Subscription | null
  topUpModal: string  // Will hold the pubkey of the sub to top up
}

export interface RootState {
  globalStates: GlobalState
}