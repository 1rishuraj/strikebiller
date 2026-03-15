import {
  SubscriptionPlan,
  Subscription,
  GlobalState
} from '@/utils/interfaces'
import { PayloadAction } from '@reduxjs/toolkit'

export const actions = {
  setMerchantPlans: (state: GlobalState, action: PayloadAction<SubscriptionPlan[]>) => {
    state.merchantPlans = action.payload
  },
  setUserSubscriptions: (state: GlobalState, action: PayloadAction<Subscription[]>) => {
    state.userSubscriptions = action.payload
  },
  setActivePlan: (state: GlobalState, action: PayloadAction<SubscriptionPlan | null>) => {
    state.activePlan = action.payload
  },
  setActiveSubscription: (state: GlobalState, action: PayloadAction<Subscription | null>) => {
    state.activeSubscription = action.payload
  },
  setTopUpModal: (state: GlobalState, action: PayloadAction<string>) => {
    state.topUpModal = action.payload
  },
}