import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createRecord } from '../../services/api';

const LeaveManagement: React.FC = () => {
    const { user } = useAuth();
    const { leaveRequests, refetchData, loading } = useData();

    const [newRequest, setNewRequest] = useState({
        reason: '',
        startDate: '',
        endDate: '',
    });

    if (!user) return null;

    const myLeaveRequests = leaveRequests.filter(req => req.designerId === user.id);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewRequest({...newRequest, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRequest.reason || !newRequest.startDate || !newRequest.endDate) return;

        await createRecord('leave_requests', {
            designer_id: user.id,
            reason: newRequest.reason,
            start_date: newRequest.startDate,
            end_date: newRequest.endDate,
            status: 'Pending',
        });

        await refetchData();
        setNewRequest({ reason: '', startDate: '', endDate: '' });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-headline">Leave Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-text-headline mb-4">Request Leave</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-text-headline">Reason</label>
                            <input type="text" name="reason" value={newRequest.reason} onChange={handleInputChange} className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-headline">Start Date</label>
                            <input type="date" name="startDate" value={newRequest.startDate} onChange={handleInputChange} className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-headline">End Date</label>
                            <input type="date" name="endDate" value={newRequest.endDate} onChange={handleInputChange} className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" required />
                        </div>
                        <Button type="submit" className="w-full">Submit Request</Button>
                    </form>
                </Card>

                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-text-headline mb-4">Your Requests</h2>
                    
                    {loading ? <p>Loading requests...</p> : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden space-y-3">
                                {myLeaveRequests.map(req => (
                                    <div key={req.id} className="bg-primary-bg p-4 rounded-xl text-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-text-headline">{req.reason}</p>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                req.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                                                req.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className="text-text-muted">{req.startDate} to {req.endDate}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-text-muted uppercase bg-primary-bg">
                                        <tr>
                                            <th className="px-6 py-3">Reason</th>
                                            <th className="px-6 py-3">Dates</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myLeaveRequests.map(req => (
                                            <tr key={req.id} className="border-b border-border-color">
                                                <td className="px-6 py-4 font-medium text-text-headline">{req.reason}</td>
                                                <td className="px-6 py-4">{req.startDate} to {req.endDate}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        req.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                                                        req.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default LeaveManagement;