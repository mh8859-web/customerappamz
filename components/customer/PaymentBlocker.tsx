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
        // Project.isPaymentAlertActive must be true
        return projects.find(p => p.customerId === user.id && p.isPaymentAlertActive === true);
    }, [user, projects]);

    const activeMilestone = useMemo(() => {
        if (!activeLockProject) return null;
        // Find the first milestone that isn't paid
        return milestones.find(m => m.projectId === activeLockProject.id && m.statusDisplay !== 'Paid');
    }, [activeLockProject, milestones]);

    useEffect(() => {
        if (timeLeft === null || timeLeft === 0) return;

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
                body: `CLIENT NOTIFICATION: User has marked "${activeMilestone.title}" as settled. Please verify to restore access.`,
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
            {/* Absolute Luxury Decor */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-600 rounded-full blur-[180px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-gold rounded-full blur-[180px]"></div>
            </div>

            <div className="max-w-2xl w-full space-y-12 animate-reveal relative z-10">
                <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" className="h-10 mx-auto" alt="AMAZ" />

                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-red-600/30 rounded-[40px] blur-3xl animate-pulse"></div>
                    <div className="relative w-32 h-32 rounded-[40px] bg-white text-slate-900 flex items-center justify-center shadow-gold-glow">
                        {isAwaiting ? <ClockIcon className="w-12 h-12 animate-spin-slow text-brand-gold" /> : <LockIcon className="w-12 h-12 text-red-600" />}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white uppercase tracking-tighter leading-tight">
                        PAYMENT PENDING <br/> 
                        <span className="text-brand-gold">RELEASE IT NOW</span> TO CONTINUE!
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[8px] text-[10px] font-display">Contractual Settlement Handshake</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[48px] p-10 md:p-14 backdrop-blur-3xl shadow-premium">
                    <p className="text-slate-300 text-lg md:text-xl leading-relaxed font-medium font-sans italic opacity-90">
                        "Secure your project's timeline by releasing the current milestone funds. Dashboard functions are restricted until verification."
                    </p>

                    <div className="mt-10 py-8 border-y border-white/5">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">AMOUNT DUE</p>
                        <p className="text-5xl font-display font-extrabold text-white mt-3 tabular-nums">₹{activeMilestone.amountDisplay.toLocaleString()}</p>
                    </div>

                    <div className="mt-12 flex flex-col gap-5">
                        {timeLeft === null && !isAwaiting && (
                            <>
                                <Button 
                                    onClick={() => setTimeLeft(600)} 
                                    className="!w-full !py-8 !rounded-full !bg-white !text-slate-900 !text-xl !font-extrabold uppercase tracking-[4px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all font-display"
                                >
                                    I'LL PAY NOW
                                </Button>
                                <Button 
                                    onClick={handleIPaid} 
                                    variant="secondary" 
                                    className="!w-full !py-6 !rounded-full !bg-white/5 !text-white !border-white/10 !text-[12px] !font-bold uppercase tracking-[6px] hover:!bg-white/10 transition-all font-display"
                                >
                                    I PAID
                                </Button>
                            </>
                        )}

                        {timeLeft !== null && timeLeft > 0 && !isAwaiting && (
                            <div className="space-y-8 animate-reveal">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-brand-gold uppercase tracking-[4px] mb-4">REMAINING GRACE PERIOD</p>
                                    <p className="text-8xl font-display font-extrabold text-white tracking-tighter tabular-nums">{formatTimer(timeLeft)}</p>
                                </div>
                                <Button 
                                    onClick={handleIPaid} 
                                    className="!w-full !py-8 !rounded-full !bg-white !text-slate-900 !text-xl !font-extrabold uppercase tracking-[4px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all font-display"
                                >
                                    I PAID
                                </Button>
                            </div>
                        )}

                        {isAwaiting && (
                            <div className="space-y-8 animate-reveal">
                                <div className="flex items-center justify-center gap-5 bg-white/10 py-8 px-8 rounded-[32px] border border-white/10">
                                    <CheckCircleIcon className="w-10 h-10 text-brand-gold animate-pulse" />
                                    <div className="text-left">
                                        <p className="text-sm font-extrabold text-white uppercase tracking-widest">AWAITING CONFIRMATION</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Our team is verifying the receipt.</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ACCESS IS RESTORED IMMEDIATELY UPON VERIFICATION</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[4px] opacity-40 font-sans">Locked System &bull; AMAZ SECURITY CORE &bull; V.4.1</p>
            </div>
        </div>
    );
};

export default PaymentBlocker;