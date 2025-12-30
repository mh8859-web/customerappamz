import React, { useState, useEffect } from 'react';

const AppShell = () => {
    const [showRecovery, setShowRecovery] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowRecovery(true), 4000);
        return () => clearTimeout(timer);
    }, []);

    const handleHardReset = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-300 overflow-hidden relative">
            {/* Skeleton Sidebar - High Fidelity */}
            <aside className="hidden md:flex w-72 bg-slate-50 border-r border-slate-200 flex-col opacity-60">
                <div className="h-24 px-8 border-b border-slate-200/60 flex items-center mb-8">
                    <div className="h-6 bg-slate-200 rounded-lg w-32 animate-pulse"></div>
                </div>
                <div className="px-4 space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-200/40 rounded-xl w-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
                    ))}
                </div>
                <div className="mt-auto p-6 bg-slate-100/50 h-24 border-t border-slate-200/60 flex items-center justify-center">
                    <div className="h-10 bg-slate-200 rounded-xl w-full animate-pulse"></div>
                </div>
            </aside>

            {/* Skeleton Main Container */}
            <div className="flex flex-col flex-1 relative">
                {/* Skeleton Header */}
                <header className="h-20 px-8 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div className="w-48 h-8 bg-slate-100 rounded-xl animate-pulse"></div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse"></div>
                        <div className="h-10 w-32 bg-slate-100 rounded-xl animate-pulse"></div>
                    </div>
                </header>

                {/* Skeleton Main Content */}
                <main className="p-8 flex-1 overflow-hidden bg-slate-50/30">
                    <div className="max-w-6xl mx-auto w-full space-y-10">
                        {/* Page Header Area */}
                        <div className="space-y-3">
                            <div className="h-10 w-64 bg-slate-200 rounded-2xl animate-pulse"></div>
                            <div className="h-4 w-96 bg-slate-100 rounded-full animate-pulse"></div>
                        </div>

                        {/* Dashboard/Grid Simulation */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-36 bg-white border border-slate-100 shadow-sm rounded-3xl animate-pulse" style={{ animationDelay: `${i * 150}ms` }}></div>
                            ))}
                        </div>

                        {/* Large Content Area Simulation */}
                        <div className="bg-white border border-slate-100 shadow-premium rounded-[32px] overflow-hidden">
                            <div className="h-16 bg-slate-50 border-b border-slate-100 w-full animate-pulse"></div>
                            <div className="p-8 space-y-5">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-14 bg-slate-50/50 rounded-2xl w-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Recovery Overlay */}
            {showRecovery && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-8 rounded-3xl shadow-modal border border-slate-100 text-center max-w-sm">
                        <h3 className="text-slate-900 font-bold text-lg">System synchronization is slow</h3>
                        <p className="text-slate-500 text-sm mt-2 mb-6">We're having trouble reaching the database. Would you like to try resetting the connection?</p>
                        <button 
                            onClick={handleHardReset}
                            className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold text-sm shadow-button hover:scale-105 transition-transform"
                        >
                            Reset Data Link
                        </button>
                    </div>
                </div>
            )}

            {/* Gold Luxury Accent Bottom Indicator */}
            <div className="fixed bottom-8 right-8 w-1 h-16 bg-brand-gold/10 rounded-full"></div>
        </div>
    );
};

export default AppShell;