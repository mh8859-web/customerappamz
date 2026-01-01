import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { updateRecord, createRecord } from '../../services/api';
import Button from '../ui/Button';
import { AlertTriangleIcon, ClockIcon, LockIcon, CheckCircleIcon } from '../icons';

const PaymentBlocker: React.FC = () => {
    const { user } = useAuth();
    const { projects, milestones, refetchData } = useData();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Identify if the blocker should be active
    const activeLockProject = useMemo(() => {
        if (!user || user.role !== 'Customer') return null;
        return projects.find(p => p.customerId === user.id && p.isPaymentAlertActive === true);
    }, [user, projects]);

    const activeMilestone = useMemo(() => {
        if (!activeLockProject) return null;
        return milestones.find(m => m.projectId === activeLockProject.id && m.statusDisplay !== 'Paid');
    }, [activeLockProject, milestones]);

    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft === 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleIPaid = async () => {
        if (!activeMilestone || isVerifying) return;
        setIsVerifying(true);
        try {
            await updateRecord('milestones', activeMilestone.id, { status_display: 'Verifying' });
            await createRecord('messages', {
                chat_id: activeLockProject!.id,
                body: "CLIENT NOTIFICATION: Settlement initiated by user. Lock clearing requested.",
                sender_id: user!.id,
                is_system_message: true
            });
            await refetchData();
        } finally {
            setIsVerifying(false);
        }
    };

    if (!activeLockProject || !activeMilestone) return null;

    const isAwaiting = activeMilestone.statusDisplay === 'Verifying';

    return (
        <div className="fixed inset-0 z-[20000] bg-slate-900 flex items-center justify-center p-6 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-500 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-gold rounded-full blur-[150px]"></div>
            </div>

            <div className="max-w-2xl w-full space-y-12 animate-in relative z-10">
                <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" className="h-12 mx-auto" alt="AMAZ" />

                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-red-500/20 rounded-[48px] blur-3xl animate-pulse"></div>
                    <div className="relative w-32 h-32 rounded-[48px] bg-white text-slate-900 flex items-center justify-center shadow-gold-glow">
                        {isAwaiting ? <ClockIcon className="w-12 h-12 animate-spin-slow" /> : <LockIcon className="w-12 h-12" />}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-5xl md:text-6xl font-display font-black text-white uppercase tracking-tighter leading-tight">PAYMENT PENDING</h2>
                    <p className="text-brand-gold font-bold uppercase tracking-[8px] text-xs font-display">Release Funds Now to Continue</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[48px] p-10 md:p-14 backdrop-blur-3xl shadow-modal">
                    <p className="text-slate-300 text-lg md:text-xl leading-relaxed font-medium font-sans italic">
                        "Your project dashboard is temporarily locked for safety. Please settle the dues to restore full architectural access."
                    </p>

                    <div className="mt-10 py-6 border-y border-white/5 flex flex-col items-center">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">DUE SETTLEMENT</p>
                        <p className="text-4xl font-display font-black text-white mt-2">₹{activeMilestone.amountDisplay.toLocaleString()}</p>
                    </div>

                    <div className="mt-12 flex flex-col gap-5">
                        {timeLeft === null && !isAwaiting && (
                            <>
                                <Button 
                                    onClick={() => setTimeLeft(600)} 
                                    className="!w-full !py-8 !rounded-full !bg-white !text-slate-900 !text-xl !font-black uppercase tracking-[4px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all font-display"
                                >
                                    I'LL PAY NOW
                                </Button>
                                <Button 
                                    onClick={handleIPaid} 
                                    variant="secondary" 
                                    className="!w-full !py-6 !rounded-full !bg-white/5 !text-white !border-white/10 !text-[12px] !font-black uppercase tracking-[6px] hover:!bg-white/10 transition-all font-display"
                                >
                                    I PAID
                                </Button>
                            </>
                        )}

                        {timeLeft !== null && timeLeft > 0 && !isAwaiting && (
                            <div className="space-y-8 animate-in">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-brand-gold uppercase tracking-[4px] mb-4">GRACE PERIOD ACTIVE</p>
                                    <p className="text-7xl font-display font-black text-white tracking-tighter tabular-nums">{formatTimer(timeLeft)}</p>
                                </div>
                                <Button 
                                    onClick={handleIPaid} 
                                    className="!w-full !py-8 !rounded-full !bg-white !text-slate-900 !text-xl !font-black uppercase tracking-[4px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all font-display"
                                >
                                    I PAID
                                </Button>
                            </div>
                        )}

                        {isAwaiting && (
                            <div className="space-y-6 animate-in">
                                <div className="flex items-center justify-center gap-4 bg-white/10 py-6 rounded-[32px] border border-white/10">
                                    <CheckCircleIcon className="w-8 h-8 text-brand-gold" />
                                    <div className="text-left">
                                        <p className="text-xs font-black text-white uppercase tracking-widest">SETTLEMENT IN VERIFICATION</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Access Restored Once Audited</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accounts team usually verifies within 2-4 hours</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">Locked System Registry &bull; End-to-End Encrypted</p>
            </div>
        </div>
    );
};

export default PaymentBlocker;