import React from 'react';

const AppShell = () => (
    <div className="flex h-screen bg-slate-50 text-slate-300 overflow-hidden">
        {/* Skeleton Sidebar - Premium Styled */}
        <aside className="hidden md:flex w-72 bg-slate-50 border-r border-slate-200 flex-col animate-pulse">
            <div className="h-24 px-8 border-b border-slate-200/60 flex items-center mb-8">
                <div className="h-6 bg-slate-200 rounded-lg w-32"></div>
            </div>
            <div className="px-4 space-y-2">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-11 bg-slate-200/40 rounded-xl w-full"></div>
                ))}
            </div>
            <div className="mt-auto p-6 bg-slate-100/50 h-24 border-t border-slate-200/60 flex items-center justify-center">
                 <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
            </div>
        </aside>

        {/* Skeleton Main Container */}
        <div className="flex flex-col flex-1 relative animate-pulse">
            {/* Skeleton Header */}
            <header className="h-20 px-8 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="w-48 h-8 bg-slate-100 rounded-xl"></div>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                    <div className="h-10 w-32 bg-slate-100 rounded-xl"></div>
                </div>
            </header>

            {/* Skeleton Main Content */}
            <main className="p-8 flex-1 overflow-hidden bg-white/40">
                <div className="max-w-6xl mx-auto w-full space-y-10">
                    {/* Page Header Area */}
                    <div className="space-y-3">
                        <div className="h-10 w-64 bg-slate-200 rounded-2xl"></div>
                        <div className="h-4 w-96 bg-slate-100 rounded-full"></div>
                    </div>

                    {/* Dashboard/Grid Simulation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-white border border-slate-100 shadow-sm rounded-3xl"></div>
                        ))}
                    </div>

                    {/* Large Content Area Simulation */}
                    <div className="bg-white border border-slate-100 shadow-premium rounded-[32px] overflow-hidden">
                        <div className="h-16 bg-slate-50 border-b border-slate-100 w-full"></div>
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-slate-50/50 rounded-2xl w-full"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>

        {/* Gold Luxury Accent Bottom Indicator */}
        <div className="fixed bottom-8 right-8 w-1 h-16 bg-brand-gold/10 rounded-full"></div>
    </div>
);

export default AppShell;