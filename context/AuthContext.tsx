import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  login: (uniqueId: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USERS: Record<string, { role: UserRole; id: string; password: string }> = {
    '786786': { role: 'Admin', id: 'user-admin-1', password: 'INTER@7m' },
    'designer@aura.com': { role: 'Designer', id: 'user-designer-1', password: 'password123' },
    'customer@aura.com': { role: 'Customer', id: 'user-customer-1', password: 'password123' },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (uniqueId: string, password: string): Promise<boolean> => {
    // In a live app, this would be an API call.
    let userToLogin = MOCK_USERS.find(u => u.email === uniqueId || u.id === uniqueId);

    if (userToLogin) {
        if (userToLogin.password === password) {
            setUser(userToLogin);
            return true;
        }
        return false;
    }

    // If user doesn't exist, check if it's a default user trying to log in for the first time.
    if (!userToLogin && DEFAULT_USERS[uniqueId] && password === DEFAULT_USERS[uniqueId].password) {
        const defaultUserInfo = DEFAULT_USERS[uniqueId];
        const role = defaultUserInfo.role;
        userToLogin = {
            id: defaultUserInfo.id,
            fullName: `${role} User`,
            email: uniqueId,
            role: role,
            avatarUrl: `https://i.pravatar.cc/150?u=${uniqueId}`,
            verified: role === 'Admin',
            password: defaultUserInfo.password,
        };
        MOCK_USERS.push(userToLogin);
        setUser(userToLogin);
        return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};