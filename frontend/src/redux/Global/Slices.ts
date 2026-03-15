import { createSlice } from '@reduxjs/toolkit'
import { states } from './states/States'
import { actions } from './actions/Actions'

export const slices = createSlice({
  name: 'global',
  initialState: states,
  reducers: actions,
})

export const {
  setMerchantPlans,
  setUserSubscriptions,
  setActivePlan,
  setActiveSubscription,
  setTopUpModal
} = slices.actions

export default slices.reducer