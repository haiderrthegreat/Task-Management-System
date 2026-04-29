import { configureStore } from '@reduxjs/toolkit';

import { API } from './api';
import authReducer from './slices/authSlice';
import counterReducer from './slices/counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    [API.reducerPath]: API.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(API.middleware),
  devTools: __DEV__,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
