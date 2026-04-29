import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { AuthUser } from '../api';

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
};

const initialState: AuthState = {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state: AuthState, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
    },
    setToken: (state: AuthState, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    clearAuth: (state: AuthState) => {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setUser, setToken, clearAuth } = authSlice.actions;

export default authSlice.reducer;
