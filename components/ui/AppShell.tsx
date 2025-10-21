import React from 'react';

// Renders an instant, static skeleton of the app UI while authentication is checked for protected routes.
// This eliminates jarring layout shifts and makes the app feel incredibly fast for returning users.
const AppShell = () => (
    <div className="flex h-screen bg-page-bg text-text-secondary">
        {/* Skeleton Sidebar */}
        <aside className="hidden md:block w-72 bg-surface border-r border-border-color/50 p-6 pt-8 space-y-8 animate-pulse">
            <div className="h-10 bg-secondary rounded-lg w-3/4"></div>
            <div className="space-y-2">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="h-12 bg-secondary rounded-full"></div>
                ))}
            </div>
        </aside>
        {/* Skeleton Header & Main Content */}
        <div className="flex flex-col flex-1 animate-pulse">
            {/* Skeleton Header */}
            <header className="h-20 px-8 bg-surface/80 border-b border-border-color/50 flex items-center justify-between">
                <div className="w-80 h-11 bg-secondary rounded-full"></div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block w-32 h-9 bg-secondary rounded-lg"></div>
                    <div className="w-11 h-11 bg-secondary rounded-full"></div>
                    <div className="w-11 h-11 bg-secondary rounded-full"></div>
                </div>
            </header>
            {/* Skeleton Main */}
            <main className="p-4 md:p-8 flex-1">
                <div className="h-10 w-1/3 bg-secondary rounded-lg mb-8"></div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="h-28 bg-secondary rounded-2xl"></div>
                    <div className="h-28 bg-secondary rounded-2xl"></div>
                    <div className="h-28 bg-secondary rounded-2xl"></div>
                </div>
                <div className="mt-6 h-80 bg-secondary rounded-2xl"></div>
            </main>
        </div>
    </div>
);

export default AppShell;
