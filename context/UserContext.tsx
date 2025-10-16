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
    // This function is now wrapped in a try/catch/finally block.
    // This is a critical fix to prevent the app from getting stuck on the loading screen
    // if the API call to fetch users fails for any reason (e.g., network error, RLS policy).
    // The 'finally' block GUARANTEES that loading is set to false, resolving the infinite loading state.
    setLoading(true);
    try {
        const userList = await getUsers();
        setUsers(userList);
    } catch (error) {
        console.error("UserContext: Failed to fetch users.", error);
        setUsers([]); // Clear users on error to prevent using stale or incorrect data.
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && authUser) {
        fetchAllUsers();
    } else if (!authLoading && !authUser) {
        setUsers([]);
        setLoading(false);
    }
  }, [authLoading, authUser, fetchAllUsers]);

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
