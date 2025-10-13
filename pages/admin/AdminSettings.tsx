import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { BuildingIcon, ShieldCheckIcon, PaletteIcon, CreditCardIcon, MailIcon, DatabaseIcon } from '../../components/icons';

type SettingsTab = 'profile' | 'permissions' | 'customization' | 'billing' | 'notifications' | 'security';

const FormField: React.FC<{label: string, children: React.ReactNode, description?: string}> = ({label, children, description}) => (
    <div>
        <label className="block text-sm font-medium text-text-headline">{label}</label>
        {children}
        {description && <p className="mt-1 text-xs text-text-muted">{description}</p>}
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; setEnabled: (enabled: boolean) => void }> = ({ label, enabled, setEnabled }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-sm text-text-headline">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={enabled} onChange={() => setEnabled(!enabled)} />
      <div className={`block w-14 h-8 rounded-full transition ${enabled ? 'bg-accent' : 'bg-surface'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'transform translate-x-6' : ''}`}></div>
    </div>
  </label>
);


const CompanyProfileSettings = () => {
    const inputClasses = "w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent";
    return (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">Company Profile</h2>
            <p className="text-sm text-text-muted mb-6">Update your company's profile information and branding.</p>
            <form className="space-y-4">
                <FormField label="Company Logo">
                    <div className="flex items-center gap-4">
                        <img src="https://i.pravatar.cc/150?u=aura-logo" alt="Company Logo" className="w-16 h-16 rounded-full"/>
                        <input type="file" className={`${inputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/20 file:text-accent hover:file:bg-accent/30`}/>
                    </div>
                </FormField>
                <FormField label="Company Name">
                    <input type="text" defaultValue="Aura Interiors" className={inputClasses} />
                </FormField>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Contact Number">
                        <input type="tel" defaultValue="+1 (555) 123-4567" className={inputClasses} />
                    </FormField>
                    <FormField label="Website">
                        <input type="url" defaultValue="https://www.aura-interiors.com" className={inputClasses} />
                    </FormField>
                </div>
                 <FormField label="Default Currency">
                    <select className={inputClasses} defaultValue="INR">
                        <option>INR</option>
                        <option>USD</option>
                        <option>EUR</option>
                    </select>
                </FormField>
                <div className="pt-4 text-right">
                    <Button>Save Changes</Button>
                </div>
            </form>
        </Card>
    );
};
const PermissionsSettings = () => {
    const roles = ['Admin', 'Designer', 'Customer'];
    const permissions = [
        { feature: 'Projects', actions: ['Create', 'View', 'Edit', 'Delete'] },
        { feature: 'Users', actions: ['Invite', 'View', 'Edit', 'Delete'] },
        { feature: 'Billing', actions: ['View Milestones', 'Mark as Paid', 'Manage Subscription'] },
        { feature: 'Designs', actions: ['Upload', 'Request Approval', 'Approve/Reject'] },
    ];
    // Mock permission state
    const hasPermission = (role: string, action: string) => {
        if (role === 'Admin') return true;
        if (role === 'Designer' && ['View', 'Edit', 'Upload', 'Request Approval'].includes(action)) return true;
        if (role === 'Customer' && ['View', 'Approve/Reject'].includes(action)) return true;
        return false;
    };

    return (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">Roles & Permissions</h2>
            <p className="text-sm text-text-muted mb-6">Control what users can see and do in the application.</p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-muted uppercase bg-primary-bg">
                        <tr>
                            <th className="px-6 py-3">Feature</th>
                            {roles.map(role => <th key={role} className="px-6 py-3 text-center">{role}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {permissions.map(({ feature, actions }) => (
                            <React.Fragment key={feature}>
                                <tr className="border-b border-border-color bg-surface/50">
                                    <td colSpan={4} className="px-6 py-3 font-semibold text-text-headline">{feature}</td>
                                </tr>
                                {actions.map(action => (
                                    <tr key={`${feature}-${action}`} className="border-b border-border-color">
                                        <td className="px-6 py-4">{action}</td>
                                        {roles.map(role => (
                                            <td key={role} className="px-6 py-4 text-center">
                                                <input type="checkbox" className="form-checkbox h-5 w-5 rounded bg-surface border-border-color text-accent focus:ring-accent"
                                                    checked={hasPermission(role, action)}
                                                    readOnly
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const CustomizationSettings = () => {
    const [clientPortalSettings, setClientPortalSettings] = useState({
        showBudgets: true,
        allowChat: true,
        showTimeline: false,
    });
    return (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">Customization & Branding</h2>
            <p className="text-sm text-text-muted mb-6">Personalize the look and feel of the application.</p>
            <div className="space-y-6">
                <FormField label="Primary Accent Color">
                    <div className="flex items-center gap-3">
                        <input type="color" defaultValue="#4FD1C5" className="w-12 h-12 bg-transparent border-none cursor-pointer" />
                        <span className="font-mono text-text-headline">#4FD1C5</span>
                    </div>
                </FormField>
                 <div>
                    <h3 className="text-lg font-semibold text-text-headline mb-2">Client Portal Settings</h3>
                    <div className="space-y-3 bg-primary-bg p-4 rounded-xl">
                        <ToggleSwitch label="Show Budgets & Milestones to Client" enabled={clientPortalSettings.showBudgets} setEnabled={(val) => setClientPortalSettings(p => ({...p, showBudgets: val}))} />
                        <ToggleSwitch label="Enable Live Chat for Client" enabled={clientPortalSettings.allowChat} setEnabled={(val) => setClientPortalSettings(p => ({...p, allowChat: val}))} />
                        <ToggleSwitch label="Show Detailed Activity Timeline" enabled={clientPortalSettings.showTimeline} setEnabled={(val) => setClientPortalSettings(p => ({...p, showTimeline: val}))} />
                    </div>
                </div>
            </div>
        </Card>
    );
};

const BillingSettings = () => (
    <Card>
        <h2 className="text-xl font-bold text-text-headline mb-4">Billing & Subscription</h2>
        <p className="text-sm text-text-muted mb-6">Manage your subscription plan and view payment history.</p>
        <div className="bg-primary-bg p-6 rounded-xl border border-border-color flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <p className="text-sm text-text-muted">Current Plan</p>
                <p className="text-2xl font-bold text-accent">Professional</p>
                <p className="text-sm text-text-headline">Next billing on Dec 21, 2024</p>
            </div>
            <div className="flex gap-3">
                <Button variant="secondary">View Payment History</Button>
                <Button>Manage Subscription</Button>
            </div>
        </div>
    </Card>
);

const NotificationSettings = () => {
    // Mock state for toggles
    const [settings, setSettings] = useState({
        newProjectAdmin: true,
        designApprovalDesigner: true,
        designApprovalCustomer: true,
        newMessageAdmin: false,
        newMessageDesigner: true,
        newMessageCustomer: true,
    });
    return (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">Notifications</h2>
            <p className="text-sm text-text-muted mb-6">Configure when and how users receive email notifications.</p>
             <div className="space-y-4">
                <div>
                    <h3 className="font-semibold text-text-headline">New Project Created</h3>
                    <ToggleSwitch label="Notify Admins" enabled={settings.newProjectAdmin} setEnabled={val => setSettings(p => ({...p, newProjectAdmin: val}))}/>
                </div>
                 <div>
                    <h3 className="font-semibold text-text-headline">Design Awaiting Approval</h3>
                    <ToggleSwitch label="Notify Assigned Designer" enabled={settings.designApprovalDesigner} setEnabled={val => setSettings(p => ({...p, designApprovalDesigner: val}))}/>
                    <ToggleSwitch label="Notify Customer" enabled={settings.designApprovalCustomer} setEnabled={val => setSettings(p => ({...p, designApprovalCustomer: val}))}/>
                </div>
                 <div>
                    <h3 className="font-semibold text-text-headline">New Chat Message</h3>
                     <ToggleSwitch label="Notify Admins" enabled={settings.newMessageAdmin} setEnabled={val => setSettings(p => ({...p, newMessageAdmin: val}))}/>
                     <ToggleSwitch label="Notify Designers" enabled={settings.newMessageDesigner} setEnabled={val => setSettings(p => ({...p, newMessageDesigner: val}))}/>
                     <ToggleSwitch label="Notify Customers" enabled={settings.newMessageCustomer} setEnabled={val => setSettings(p => ({...p, newMessageCustomer: val}))}/>
                </div>
            </div>
        </Card>
    );
};

const DataSecuritySettings = () => {
    const [tfaEnabled, setTfaEnabled] = useState(false);
    return (
        <Card>
            <h2 className="text-xl font-bold text-text-headline mb-4">Data & Security</h2>
            <p className="text-sm text-text-muted mb-6">Export data and manage security policies for your organization.</p>
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-text-headline mb-2">Data Export</h3>
                    <Button variant="secondary">Export All Project Data (JSON)</Button>
                </div>
                <div>
                    <h3 className="font-semibold text-text-headline mb-2">Security Policies</h3>
                    <div className="bg-primary-bg p-4 rounded-xl space-y-3">
                        <ToggleSwitch label="Enforce Two-Factor Authentication (2FA) for all users" enabled={tfaEnabled} setEnabled={setTfaEnabled} />
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold text-text-headline mb-2">Audit Log</h3>
                    <Button variant="secondary">View Full Audit Log</Button>
                </div>
            </div>
        </Card>
    );
};

const AdminSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    
    const settingsTabs = [
        { id: 'profile', label: 'Company Profile', icon: <BuildingIcon className="w-5 h-5" /> },
        { id: 'permissions', label: 'Roles & Permissions', icon: <ShieldCheckIcon className="w-5 h-5" /> },
        { id: 'customization', label: 'Customization', icon: <PaletteIcon className="w-5 h-5" /> },
        { id: 'billing', label: 'Billing & Subscription', icon: <CreditCardIcon className="w-5 h-5" /> },
        { id: 'notifications', label: 'Notifications', icon: <MailIcon className="w-5 h-5" /> },
        { id: 'security', label: 'Data & Security', icon: <DatabaseIcon className="w-5 h-5" /> },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <CompanyProfileSettings />;
            case 'permissions': return <PermissionsSettings />;
            case 'customization': return <CustomizationSettings />;
            case 'billing': return <BillingSettings />;
            case 'notifications': return <NotificationSettings />;
            case 'security': return <DataSecuritySettings />;
            default: return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-headline">Admin Settings</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <Card className="lg:col-span-1 h-fit">
                    <nav className="space-y-2">
                        {settingsTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as SettingsTab)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-accent/10 text-accent font-semibold'
                                        : 'hover:bg-surface text-text-muted'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </Card>
                <div className="lg:col-span-3">
                    {renderContent()}
                </div>
            </div>

            <footer className="mt-12 text-center border-t border-border-color pt-8">
              <p className="text-sm text-text-muted mb-2">Powered By:</p>
              <img 
                src="https://myacc786.s3.ap-south-1.amazonaws.com/png%20(4).png" 
                alt="Powered by logo" 
                className="h-10 mx-auto" 
              />
            </footer>
        </div>
    );
};

export default AdminSettings;