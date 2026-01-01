
import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useUsers } from '../../context/UserContext';
import { supabase } from '../../services/supabaseClient';
import { DollarSignIcon, ZapIcon, RefreshIcon, UserGroupIcon, AlertTriangleIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import { UserSalaryConfig } from '../../types';

const SalaryAllocation: React.FC = () => {
    const { users, loading: usersLoading } = useUsers();
    const [configs, setConfigs] = useState<UserSalaryConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [dbError, setDbError] = useState<string | null>(null);

    // ADMIN IS HEAD: Exclude 'Admin' from salary allocation list.
    const staffUsers = users.filter(u => u.role !== 'Customer' && u.role !== 'Admin');

    const fetchConfigs = async () => {
        setLoading(true);
        setDbError(null);
        try {
            const { data, error } = await supabase.from('user_salary_configs').select('*');
            if (error) {
                if (error.message.includes('not found') || error.code === 'PGRST116') {
                    setDbError("SCHEMA_MISSING");
                } else {
                    throw error;
                }
            } else if (data) {
                setConfigs(data.map(c => ({
                    id: c.id,
                    userId: c.user_id,
                    payType: c.pay_type,
                    baseAmount: c.base_amount,
                    updatedAt: c.updated_at
                })));
            }
        } catch (err: any) {
            setDbError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleUpdate = async (userId: string, payType: 'Monthly' | 'Daily', baseAmount: number) => {
        setIsSaving(userId);
        const existing = configs.find(c => c.userId === userId);
        
        const payload = {
            user_id: userId,
            pay_type: payType,
            base_amount: baseAmount,
            updated_at: new Date().toISOString()
        };

        const { error } = existing 
            ? await supabase.from('user_salary_configs').update(payload).eq('id', existing.id)
            : await supabase.from('user_salary_configs').insert(payload);

        if (error) alert(`Sync Failure: ${error.message}. Ensure the Salary tables are created in Supabase.`);
        else await fetchConfigs();
        
        setIsSaving(null);
    };

    if (usersLoading || loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-[6px]">Syncing Payroll Ledger...</div>;

    if (dbError === "SCHEMA_MISSING") {
        return (
            <div className="p-20 text-center space-y-6">
                <AlertTriangleIcon className="w-16 h-16 text-brand-gold mx-auto animate-bounce" />
                <h2 className="text-2xl font-display font-black text-slate-900 uppercase">Schema Initialization Required</h2>
                <p className="text-slate-500 max-w-md mx-auto font-medium">The Salary Allocation table does not exist in your database yet. Please go to <strong>Admin Settings > Danger Zone</strong> and run the <strong>Master SQL</strong> script to initialize all features.</p>
                <Button onClick={() => window.location.reload()} variant="secondary" className="!rounded-full">Check Connection Again</Button>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-16">
            <div>
                <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight uppercase">Salary Allocation</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-2">Executive Remuneration Management</p>
            </div>

            <Card className="luxury-glass p-0 overflow-hidden rounded-[40px] border-slate-100 shadow-premium">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Member Identity</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Structure</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px]">Base Valuation (₹)</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-right">Commit Sync</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {staffUsers.map(user => {
                                const config = configs.find(c => c.userId === user.id) || { payType: 'Monthly', baseAmount: 0 };
                                return (
                                    <SalaryRow 
                                        key={user.id} 
                                        user={user} 
                                        config={config} 
                                        isSaving={isSaving === user.id} 
                                        onSave={(type, amt) => handleUpdate(user.id, type, amt)} 
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const SalaryRow: React.FC<{ 
    user: any; 
    config: Partial<UserSalaryConfig>; 
    isSaving: boolean;
    onSave: (type: 'Monthly' | 'Daily', amt: number) => void;
}> = ({ user, config, isSaving, onSave }) => {
    const [localType, setLocalType] = useState<'Monthly' | 'Daily'>(config.payType || 'Monthly');
    const [localAmt, setLocalAmt] = useState(config.baseAmount || 0);

    const isChanged = localType !== config.payType || localAmt !== config.baseAmount;

    return (
        <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="px-8 py-6">
                <UserNameDisplay user={user} showAvatar={true} textClassName="font-black text-slate-900 uppercase tracking-wide" imageSize="w-10 h-10" />
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{user.role}</p>
            </td>
            <td className="px-8 py-6">
                <select 
                    value={localType} 
                    onChange={e => setLocalType(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-blue/20"
                >
                    <option value="Monthly">Fixed Monthly</option>
                    <option value="Daily">Daily Wage</option>
                </select>
            </td>
            <td className="px-8 py-6">
                <div className="relative w-40">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input 
                        type="number" 
                        value={localAmt} 
                        onChange={e => setLocalAmt(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-blue/20" 
                    />
                </div>
            </td>
            <td className="px-8 py-6 text-right">
                <Button 
                    variant={isChanged ? 'gold' : 'secondary'}
                    disabled={!isChanged || isSaving}
                    onClick={() => onSave(localType, localAmt)}
                    className="!rounded-full !px-8 !py-2.5 !text-[10px] font-black uppercase tracking-widest shadow-soft"
                >
                    {isSaving ? 'Syncing...' : isChanged ? 'Sync' : 'Current'}
                </Button>
            </td>
        </tr>
    );
};

export default SalaryAllocation;
