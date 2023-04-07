import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from './AuthStorage'

interface BaseState {
	isLoggedIn: boolean,
	username: String
};

const initialState:BaseState = {
	isLoggedIn: false,
	username: ''
};

export const AuthSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state) => {
      state.isLoggedIn = true;
	  state.username = 'sample';
    },
    logout: (state) => {
      state.isLoggedIn = false;
	  state.username = '';
    }
  },
})

// Action creators are generated for each case reducer function
export const { login, logout } = AuthSlice.actions

export const selectAuth = (state: RootState) => state.auth.isLoggedIn;

export default AuthSlice.reducer