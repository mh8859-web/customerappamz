import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UserContext';
import { useData } from '../context/DataContext';
import App from '../App';

const FullPageLoader: React.FC = () => (
    <div className="flex items-center justify-center h-screen bg-page-bg">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-blue"></div>
    </div>
);

const AppInitializer: React.FC = () => {
    const { loading: authLoading, user } = useAuth();
    const { loading: usersLoading } = useUsers();
    const { loading: dataLoading } = useData();

    // The app is considered loading if authentication is still in progress,
    // OR if a user is logged in but we are still fetching the user list or the main application data.
    // This prevents the app from rendering with incomplete data.
    const isLoading = authLoading || (!!user && (usersLoading || dataLoading));

    if (isLoading) {
        return <FullPageLoader />;
    }
    
    // Once all loading is complete, render the main App component.
    return <App />;
};

export default AppInitializer;
