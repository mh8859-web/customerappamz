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

    // Phase 1: Wait for the initial authentication check to complete.
    // This is the most critical step. `authLoading` will become false once
    // we know if the user is logged in or not.
    if (authLoading) {
        return <FullPageLoader />;
    }

    // Phase 2: If a user is logged in, we must wait for their essential data to load.
    // This prevents rendering the dashboard with incomplete information.
    if (user && (usersLoading || dataLoading)) {
        return <FullPageLoader />;
    }
    
    // Phase 3: All loading is complete.
    // - If `user` is null, <App /> will route to the login page.
    // - If `user` exists, all data is loaded, and <App /> will render the dashboard.
    return <App />;
};

export default AppInitializer;