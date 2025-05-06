import React, { createContext, useContext } from 'react';

// For dev: always return an admin user
const AuthContext = createContext({
  user: { id: 'admin1', roles: ['ADMIN'] },
  isAuthenticated: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  // In production, replace this with real auth logic
  const value = {
    user: { id: 'admin1', roles: ['ADMIN'] },
    isAuthenticated: true,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 