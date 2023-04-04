import React, { createContext, useState } from 'react';


interface AuthContextType {
	isLoggedIn: boolean;
	login: () => void;
	logout: () => void;
  }
  
export const AuthContext = createContext<AuthContextType>({
	isLoggedIn: false,
	login: () => {},
	logout: () => {},
});
  

export const AuthProvider = ({ children }:any) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = () => {
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};