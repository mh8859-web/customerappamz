
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { createRecord, signUpNewUser, updateRecord } from '../../services/api'; // Import signUpNewUser and updateRecord
import { supabase } from '../../services/supabaseClient'; // Import local supabase client for lookups
import { DatabaseIcon, CheckCircleIcon, UserIcon, RefreshIcon, BriefcaseIcon, DollarSignIcon } from '../icons';

interface SyncQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

// Interface for the external quote data
interface ExternalQuote {
  id: string;
  client_name: string; // or name
  location: string;    // or address
  total_amount: number; // or amount
  status: string;
  created_at: string;
  email?: string;
  phone?: string;
}

const SyncQuotesModal: React.FC<SyncQuotesModalProps> = ({ isOpen, onClose, onSyncComplete }) => {
  const { users, refetchUsers } = useUsers(); // Add refetchUsers
  const { user: currentUser } = useAuth();
  
  const [step, setStep] = useState<'config' | 'fetching' | 'mapping' | 'importing'>('config');
  const [externalUrl, setExternalUrl] = useState('');
  const [externalKey, setExternalKey] = useState('');
  const [fetchedQuotes, setFetchedQuotes] = useState<ExternalQuote[]>([]);
  const [importStatus, setImportStatus] = useState<Record<string, 'pending' | 'success' | 'error' | 'skipped'>>({});
  
  // Map quote ID to selected customer ID from local DB
  const [customerMapping, setCustomerMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load saved credentials from localStorage if available
    const savedUrl = localStorage.getItem('ext_quote_url');
    const savedKey = localStorage.getItem('ext_quote_key');
    if (savedUrl) setExternalUrl(savedUrl);
    if (savedKey) setExternalKey(savedKey);
  }, [isOpen]);

  const handleConnect = async () => {
    if (!externalUrl || !externalKey) {
        alert("Please provide both URL and API Key.");
        return;
    }

    setStep('fetching');
    localStorage.setItem('ext_quote_url', externalUrl);
    localStorage.setItem('ext_quote_key', externalKey);

    try {
        const externalClient = createClient(externalUrl, externalKey);
        
        // Fetch quotes with status 'Booked'
        const { data, error } = await externalClient
            .from('quotes')
            .select('*')
            .eq('status', 'Booked');

        if (error) throw error;

        if (data) {
            setFetchedQuotes(data as ExternalQuote[]);
            
            // Try to auto-map customers by name matches
            const initialMapping: Record<string, string> = {};
            data.forEach((quote: any) => {
                const match = users.find(u => 
                    u.fullName.toLowerCase() === quote.client_name?.toLowerCase() ||
                    (quote.email && u.email.toLowerCase() === quote.email.toLowerCase())
                );
                if (match) {
                    initialMapping[quote.id] = match.id;
                }
            });
            setCustomerMapping(initialMapping);
            
            setStep('mapping');
        }
    } catch (err: any) {
        alert(`Failed to connect or fetch data: ${err.message}`);
        setStep('config');
    }
  };

  const handleImport = async () => {
    setStep('importing');
    let hasNewUsers = false;
    
    for (const quote of fetchedQuotes) {
        let customerId = customerMapping[quote.id];

        // --- AUTOMATIC USER CREATION LOGIC ---
        if (!customerId) {
            try {
                // 1. Prepare User Data
                // Assumption: quote.phone contains the "Last 4 digits" or full phone.
                const mobileDigits = quote.phone?.replace(/\D/g, '') || '0000';
                const safeName = quote.client_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                
                // User ID: Use prefix '9' + digits if length < 5 to avoid short ID issues, or just use digits if sufficient.
                // Standardizing on a 5-digit ID if possible.
                const generatedUserId = mobileDigits.length < 5 ? `9${mobileDigits}` : mobileDigits.substring(0, 5);
                
                // Password: "amaz" + last 4 digits (to satisfy 6 char limit safely)
                const passwordSuffix = mobileDigits.length >= 4 ? mobileDigits.slice(-4) : mobileDigits.padEnd(4, '0');
                const generatedPassword = `amaz${passwordSuffix}`;
                
                const generatedEmail = `${safeName}.${passwordSuffix}@amaz.com`;

                console.log(`Auto-creating user: ${quote.client_name}, ID: ${generatedUserId}, Pass: ${generatedPassword}`);

                // 2. Create Auth User
                const { user: newUser, error: signUpError } = await signUpNewUser(
                    generatedEmail,
                    generatedPassword,
                    {
                        fullName: quote.client_name,
                        role: 'Customer',
                        userId: generatedUserId
                    }
                );

                if (signUpError) {
                    // Check if email already exists, if so, try to find that user
                    if (signUpError.message.includes('already registered')) {
                         const { data: existingUser } = await supabase.from('users').select('id').eq('email', generatedEmail).single();
                         if (existingUser) {
                             customerId = existingUser.id;
                         } else {
                             console.error("User exists in auth but not found in public table or other error:", signUpError);
                             setImportStatus(prev => ({ ...prev, [quote.id]: 'error' }));
                             continue;
                         }
                    } else {
                        console.error("Sign up error:", signUpError);
                        setImportStatus(prev => ({ ...prev, [quote.id]: 'error' }));
                        continue;
                    }
                } else if (newUser) {
                    // 3. Ensure Public Profile Exists/Is Updated
                    const { error: profileError } = await updateRecord('users', newUser.id, {
                        full_name: quote.client_name,
                        role: 'Customer',
                        user_id: generatedUserId,
                        verified: true, 
                    });
                    
                    if (profileError) {
                        console.error("Profile update failed:", profileError);
                        // We continue even if profile update fails, assuming trigger might have handled it, 
                        // or we try to use the auth ID anyway.
                    }
                    
                    customerId = newUser.id;
                    hasNewUsers = true;
                }

            } catch (err) {
                console.error("Auto-create user exception:", err);
                setImportStatus(prev => ({ ...prev, [quote.id]: 'error' }));
                continue;
            }
        }

        if (customerId) {
            try {
                // Create Project
                const projectData = {
                    title: `${quote.client_name} Residence`,
                    description: `Imported from Quote App. Location: ${quote.location}`,
                    customer_id: customerId,
                    designer_id: currentUser?.id, // Default to current admin/user
                    admin_id: currentUser?.id,
                    address: quote.location || 'Unknown Location',
                    budget_display: quote.total_amount || 0,
                    area_sqft: 0,
                    start_date: new Date().toISOString().split('T')[0],
                    status: 'Active',
                    stage: 'design_phase',
                    progress: 0,
                    revenue_display: 0
                };

                const { error } = await createRecord('projects', projectData);
                
                if (error) throw error;
                
                setImportStatus(prev => ({ ...prev, [quote.id]: 'success' }));
            } catch (err) {
                console.error(err);
                setImportStatus(prev => ({ ...prev, [quote.id]: 'error' }));
            }
        } else {
             setImportStatus(prev => ({ ...prev, [quote.id]: 'error' }));
        }
    }
    
    if (hasNewUsers) {
        await refetchUsers();
    }
    
    setTimeout(() => {
        onSyncComplete();
        onClose();
    }, 1500);
  };

  const formInputClasses = "w-full bg-page-bg/50 border border-border-color rounded-lg p-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-surface";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sync from Quote App">
        {step === 'config' && (
            <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                    Enter the Supabase credentials for the external Quote Software to import booked quotes.
                </p>
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Project URL</label>
                    <input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} className={formInputClasses} placeholder="https://xyz.supabase.co" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Anon API Key</label>
                    <input value={externalKey} onChange={e => setExternalKey(e.target.value)} type="password" className={formInputClasses} placeholder="eyJh..." />
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleConnect}>Connect & Fetch</Button>
                </div>
            </div>
        )}

        {step === 'fetching' && (
            <div className="flex flex-col items-center justify-center py-8">
                <RefreshIcon className="w-12 h-12 text-brand-blue animate-spin mb-4" />
                <p className="text-text-primary font-medium">Connecting to Quote Database...</p>
            </div>
        )}

        {step === 'mapping' && (
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800">
                    <strong>Auto-Creation Enabled:</strong> If a customer is not mapped, a new account will be created automatically using the name and mobile number from the quote. 
                    <br/><span className="text-xs mt-1 block">Default Password: <code>amaz</code> + last 4 digits.</span>
                </div>
                
                <p className="text-sm text-text-secondary">
                    Found <strong>{fetchedQuotes.length}</strong> booked quotes. Verify mappings below.
                </p>
                
                <div className="max-h-96 overflow-y-auto space-y-3">
                    {fetchedQuotes.length === 0 ? (
                        <p className="text-center text-text-secondary py-4">No 'Booked' quotes found.</p>
                    ) : (
                        fetchedQuotes.map(quote => (
                            <div key={quote.id} className="bg-secondary p-3 rounded-lg border border-border-color">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-text-primary">{quote.client_name}</p>
                                        <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                                            <span className="flex items-center gap-1"><BriefcaseIcon className="w-3 h-3"/> {quote.location}</span>
                                            <span className="flex items-center gap-1"><DollarSignIcon className="w-3 h-3"/> ₹{quote.total_amount?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Booked</span>
                                </div>
                                
                                <div className="flex items-center gap-2 mt-2">
                                    <UserIcon className="w-5 h-5 text-text-secondary" />
                                    <select 
                                        className="flex-1 bg-white border border-border-color rounded p-1.5 text-sm"
                                        value={customerMapping[quote.id] || ''}
                                        onChange={(e) => setCustomerMapping(prev => ({ ...prev, [quote.id]: e.target.value }))}
                                    >
                                        <option value="">[Auto-Create New Customer]</option>
                                        {users.filter(u => u.role === 'Customer').map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName} ({u.userId})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="flex justify-between pt-4 border-t border-border-color">
                    <Button variant="secondary" onClick={() => setStep('config')}>Back</Button>
                    <Button onClick={handleImport} disabled={fetchedQuotes.length === 0}>Import & Sync</Button>
                </div>
            </div>
        )}

        {step === 'importing' && (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary text-center mb-4">Importing Projects...</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {fetchedQuotes.map(quote => {
                        const status = importStatus[quote.id];
                        if (!status) return null;
                        
                        return (
                            <div key={quote.id} className="flex justify-between items-center p-2 bg-secondary rounded">
                                <span className="text-sm font-medium">{quote.client_name}</span>
                                {status === 'success' && <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircleIcon className="w-4 h-4"/> Done</span>}
                                {status === 'error' && <span className="text-red-500 text-xs">Failed</span>}
                                {status === 'skipped' && <span className="text-gray-400 text-xs">Skipped</span>}
                                {status === 'pending' && <span className="text-brand-blue text-xs animate-pulse">Processing...</span>}
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
    </Modal>
  );
};

export default SyncQuotesModal;
