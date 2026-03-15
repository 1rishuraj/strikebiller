import { configureStore } from '@reduxjs/toolkit'
import globalReducer from './Global/Slices'

export const store = configureStore({
  reducer: {
    globalStates: globalReducer,
  },
})