import { configureStore } from '@reduxjs/toolkit'
import AuthReducer from './AuthSlice'


const AuthStorage =  configureStore({
	reducer: {
		auth: AuthReducer,
	},
})

export type RootState = ReturnType<typeof AuthStorage.getState>;

export type AppDispatch = typeof AuthStorage.dispatch;

export default AuthStorage;