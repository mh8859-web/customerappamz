import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { MOCK_USERS } from '../../services/mockData';
import { CheckCircleIcon, ClockIcon } from '../../components/icons';

const FormField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div>
        <label className="block text-sm font-medium text-text-headline">{label}</label>
        {children}
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; setEnabled: (enabled: boolean) => void }> = ({ label, enabled, setEnabled }) => (
  <label className="flex items-center justify-between cursor-pointer bg-primary-bg p-3 rounded-xl">
    <span className="text-sm text-text-headline">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={enabled} onChange={() => setEnabled(!enabled)} />
      <div className={`block w-14 h-8 rounded-full transition ${enabled ? 'bg-accent' : 'bg-surface'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'transform translate-x-6' : ''}`}></div>
    </div>
  </label>
);


const MyAccount: React.FC = () => {
    const { user } = useAuth();
    // Use local state to manage UI changes immediately, as we can't update AuthContext's user directly.
    const [currentUser, setCurrentUser] = useState(MOCK_USERS.find(u => u.id === user?.id));
    const [notifications, setNotifications] = useState({
        newMessages: true,
        designUpdates: true,
        paymentReminders: true,
        projectMilestones: false,
    });

    if (!currentUser) return null;
    
    const handleVerificationRequest = () => {
        // 1. Update the mock data source (simulating a backend call)
        const userIndex = MOCK_USERS.findIndex(u => u.id === currentUser.id);
        if (userIndex > -1) {
            MOCK_USERS[userIndex].verificationRequested = true;
        }
        // 2. Update local state to trigger an immediate re-render
        setCurrentUser(prev => prev ? { ...prev, verificationRequested: true } : null);
        alert('Verification request submitted successfully! It will be reviewed by an admin.');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-headline">My Account</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                         <h2 className="text-xl font-bold text-text-headline mb-4">Profile Information</h2>
                         <form className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Full Name">
                                    <input type="text" defaultValue={currentUser.fullName} className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                                </FormField>
                                <FormField label="Email Address">
                                    <input type="email" defaultValue={currentUser.email} className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                                </FormField>
                             </div>
                             <div className="pt-2 text-right">
                                 <Button>Save Profile</Button>
                             </div>
                         </form>
                    </Card>
                     <Card>
                         <h2 className="text-xl font-bold text-text-headline mb-4">Change Password</h2>
                         <form className="space-y-4">
                             <FormField label="Current Password">
                                <input type="password"  className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                            </FormField>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="New Password">
                                    <input type="password" className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                                </FormField>
                                <FormField label="Confirm New Password">
                                    <input type="password" className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                                </FormField>
                             </div>
                             <div className="pt-2 text-right">
                                 <Button>Update Password</Button>
                             </div>
                         </form>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h2 className="text-xl font-bold text-text-headline mb-4">Notification Preferences</h2>
                        <p className="text-sm text-text-muted mb-4">Manage how you receive email notifications.</p>
                        <div className="space-y-3">
                            <ToggleSwitch label="New Chat Messages" enabled={notifications.newMessages} setEnabled={(val) => setNotifications(p => ({...p, newMessages: val}))} />
                            <ToggleSwitch label="Design Updates & Approvals" enabled={notifications.designUpdates} setEnabled={(val) => setNotifications(p => ({...p, designUpdates: val}))} />
                            <ToggleSwitch label="Payment Reminders" enabled={notifications.paymentReminders} setEnabled={(val) => setNotifications(p => ({...p, paymentReminders: val}))} />
                            <ToggleSwitch label="Project Milestone Changes" enabled={notifications.projectMilestones} setEnabled={(val) => setNotifications(p => ({...p, projectMilestones: val}))} />
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-bold text-text-headline mb-4">Account Verification</h2>
                         {currentUser.verified ? (
                            <div className="text-center bg-primary-bg p-4 rounded-xl">
                                <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-2"/>
                                <p className="font-semibold text-text-headline">You are a verified user.</p>
                            </div>
                        ) : currentUser.verificationRequested ? (
                            <div className="text-center bg-primary-bg p-4 rounded-xl">
                                <ClockIcon className="w-12 h-12 text-yellow-400 mx-auto mb-2"/>
                                <p className="font-semibold text-text-headline">Verification Pending</p>
                                <p className="text-sm text-text-muted mt-1">Your request is under review.</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-text-muted mb-4">Request a verified badge by uploading a real profile image for review.</p>
                                <FormField label="Upload Profile Image">
                                    <input type="file" accept="image/*" className="w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/20 file:text-accent hover:file:bg-accent/30" required />
                                </FormField>
                                <Button onClick={handleVerificationRequest} className="w-full mt-4">Request Verification</Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MyAccount;