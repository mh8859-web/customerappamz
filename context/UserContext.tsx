import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { getUsers } from '../services/api';
import { useAuth } from './AuthContext';

interface UserContextType {
  users: User[];
  findUserById: (id: string) => User | undefined;
  refetchUsers: () => Promise<void>;
  addUser: (user: User) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser, loading: authLoading } = useAuth();

  const fetchAllUsers = useCallback(async () => {
    if (!authUser) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
        const userList = await getUsers();
        setUsers(userList || []);
    } catch (error) {
        console.error("UserContext: Global directory sync failure.", error);
    } finally {
        setLoading(false);
    }
  }, [authUser]);

  // Method to inject a user locally for instant UI feedback
  const addUser = useCallback((newUser: User) => {
    setUsers(prev => {
        // Prevent duplicates if the refetch happened to catch it already
        if (prev.some(u => u.id === newUser.id)) return prev;
        return [newUser, ...prev];
    });
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchAllUsers();
    }
  }, [authLoading, fetchAllUsers]);

  const findUserById = useCallback((id: string): User | undefined => {
    return users.find(user => user.id === id);
  }, [users]);

  const value = {
    users,
    findUserById,
    refetchUsers: fetchAllUsers,
    addUser,
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUsers = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};