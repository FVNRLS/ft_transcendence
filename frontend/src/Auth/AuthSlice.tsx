import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from './AuthStorage'

interface BaseState {
	isLoggedIn: boolean,
	cookie: string
};

const initialState:BaseState = {
	isLoggedIn: false,
	cookie: ''
};

export const AuthSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.isLoggedIn = true;
	    state.cookie = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
	    state.cookie = '';
    }
  },
})

// Action creators are generated for each case reducer function
export const { login, logout } = AuthSlice.actions

export const selectAuth = (state: RootState) => state.auth.isLoggedIn;

export default AuthSlice.reducer