import React, { useState, useEffect, useRef } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { EditIcon } from '../../components/icons';
import { uploadAvatar, updateRecord } from '../../services/api';

const MyAccount: React.FC = () => {
    const { user, updateUserContext } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({ fullName: '' });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if(user) {
            setFormData({ fullName: user.fullName });
            setAvatarPreview(user.avatarUrl);
        }
    }, [user]);

    if (!user) {
        return <div>Loading account details...</div>;
    }

    const handleAvatarClick = () => {
        if(isEditing) {
            fileInputRef.current?.click();
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCancel = () => {
        if(user){
            setFormData({ fullName: user.fullName });
            setAvatarPreview(user.avatarUrl);
            setAvatarFile(null);
        }
        setIsEditing(false);
    }

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        
        let newAvatarUrl = user.avatarUrl;

        if (avatarFile) {
            const uploadedUrl = await uploadAvatar(user.id, avatarFile);
            if (uploadedUrl) {
                newAvatarUrl = uploadedUrl;
            } else {
                alert('Failed to upload avatar.');
                setIsSaving(false);
                return;
            }
        }
        
        const updatesForDb = {
            full_name: formData.fullName,
            avatar_url: newAvatarUrl
        };
        
        const { error } = await updateRecord('users', user.id, updatesForDb);

        if (error) {
            alert(`Failed to update profile: ${error.message}`);
        } else {
            // Update the global user state for instant UI feedback
            updateUserContext({
                fullName: formData.fullName,
                avatarUrl: newAvatarUrl
            });
            setIsEditing(false);
        }
        
        setAvatarFile(null);
        setIsSaving(false);
    };

    const inputClasses = "w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue";

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-headline">My Account</h1>
                <div className="flex gap-2">
                    {isEditing && (
                        <Button onClick={handleCancel} variant="secondary" disabled={isSaving}>
                            Cancel
                        </Button>
                    )}
                    <Button onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)} disabled={isSaving}>
                        {isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Edit Profile')}
                    </Button>
                </div>
            </div>
            
            <Card>
                <div className="flex flex-col items-center sm:flex-row gap-6">
                    <div className={`relative ${isEditing ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
                        <img src={avatarPreview || user.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full object-cover" />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <EditIcon className="w-6 h-6 text-white"/>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                    <div className="flex-1 w-full">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-headline mb-1">Full Name</label>
                                <input 
                                    type="text" 
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    readOnly={!isEditing}
                                    className={`${inputClasses} ${!isEditing ? 'bg-surface border-transparent' : ''}`}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-headline mb-1">Email (System)</label>
                                <input 
                                    type="email" 
                                    value={user.email}
                                    readOnly
                                    className={`${inputClasses} bg-surface border-transparent text-text-muted cursor-not-allowed`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-headline mb-1">User ID</label>
                                <input 
                                    type="text" 
                                    value={user.userId || ''}
                                    readOnly
                                    className={`${inputClasses} bg-surface border-transparent text-text-muted cursor-not-allowed`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MyAccount;
