import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { getUsers } from '../services/api';
import { useAuth } from './AuthContext';

interface UserContextType {
  users: User[];
  loading: boolean;
  findUserById: (id: string) => User | undefined;
  refetchUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser, loading: authLoading } = useAuth();

  const fetchAllUsers = useCallback(async () => {
    // This function now internally checks for a valid user.
    // This makes the logic more robust and centralized.
    if (!authUser) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
        const userList = await getUsers();
        setUsers(userList);
    } catch (error) {
        console.error("UserContext: Failed to fetch users.", error);
        setUsers([]);
    } finally {
        setLoading(false);
    }
  }, [authUser]); // Dependency on authUser ensures this function has the latest auth state.

  useEffect(() => {
    // This effect is now simpler. It just waits for auth to finish,
    // and then calls `fetchAllUsers`, which knows what to do based on
    // whether a user is logged in or not. This removes the race condition.
    if (!authLoading) {
      fetchAllUsers();
    }
  }, [authLoading, fetchAllUsers]);

  const findUserById = (id: string): User | undefined => {
    return users.find(user => user.id === id);
  };

  const value = {
    users,
    loading,
    findUserById,
    refetchUsers: fetchAllUsers,
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