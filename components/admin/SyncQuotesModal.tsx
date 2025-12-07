
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { createRecord } from '../../services/api';
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
  const { users } = useUsers();
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
    
    // Auto-proceed if credentials exist
    if (isOpen && savedUrl && savedKey && step === 'config') {
        // Optional: Auto-fetch could be enabled here, but manual is safer for now
    }
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
        // Note: Adjust table name 'quotes' and field names if they differ in the target app
        const { data, error } = await externalClient
            .from('quotes')
            .select('*')
            .eq('status', 'Booked'); // Assumption: Status is literally "Booked"

        if (error) throw error;

        if (data) {
            // Filter out quotes that might have already been imported? 
            // For now, we fetch all booked and let user decide.
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
    
    for (const quote of fetchedQuotes) {
        // Skip if user explicitly unchecked or didn't map (optional logic, enforcing mapping for now)
        if (!customerMapping[quote.id]) {
            setImportStatus(prev => ({ ...prev, [quote.id]: 'skipped' }));
            continue;
        }

        try {
            // Create Project
            const projectData = {
                title: `${quote.client_name} Residence`,
                description: `Imported from Quote App (Ref #${quote.id}). Location: ${quote.location}`,
                customer_id: customerMapping[quote.id],
                designer_id: currentUser?.id, // Assign to Admin initially, or leave null if allowed
                admin_id: currentUser?.id,
                address: quote.location || 'Unknown Location',
                budget_display: quote.total_amount || 0,
                area_sqft: 0, // Default
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
    }
    
    // After loop
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
                <p className="text-sm text-text-secondary">
                    Found <strong>{fetchedQuotes.length}</strong> booked quotes. Please assign a customer to each project before importing.
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
                                        <option value="">Select Existing Customer...</option>
                                        {users.filter(u => u.role === 'Customer').map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName} ({u.userId})</option>
                                        ))}
                                    </select>
                                </div>
                                {!customerMapping[quote.id] && (
                                    <p className="text-xs text-red-400 mt-1 ml-7">Customer assignment required</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
                <div className="flex justify-between pt-4 border-t border-border-color">
                    <Button variant="secondary" onClick={() => setStep('config')}>Back</Button>
                    <Button onClick={handleImport} disabled={fetchedQuotes.length === 0}>Import Selected</Button>
                </div>
            </div>
        )}

        {step === 'importing' && (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-primary text-center mb-4">Importing Projects...</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {fetchedQuotes.map(quote => {
                        const status = importStatus[quote.id];
                        if (!status && !customerMapping[quote.id]) return null;
                        
                        return (
                            <div key={quote.id} className="flex justify-between items-center p-2 bg-secondary rounded">
                                <span className="text-sm font-medium">{quote.client_name}</span>
                                {status === 'success' && <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircleIcon className="w-4 h-4"/> Done</span>}
                                {status === 'error' && <span className="text-red-500 text-xs">Failed</span>}
                                {status === 'skipped' && <span className="text-gray-400 text-xs">Skipped</span>}
                                {!status && <span className="text-brand-blue text-xs animate-pulse">Processing...</span>}
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