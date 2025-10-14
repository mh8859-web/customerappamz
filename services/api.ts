import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

interface SignUpMetadata {
    fullName: string;
    role: UserRole;
    userId: string;
}

// Fetch all users from the public 'users' table
export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    // Map snake_case columns to camelCase properties
    return data.map(user => ({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=4FD1C5&color=1A202C`,
        verified: !!user.verified, // FIX: Ensure verified is always a boolean to fix display bug.
        verificationRequested: user.verification_requested,
        userId: user.user_id,
    }));
};

// Sign up a new user using Supabase Auth
export const signUpNewUser = async (email: string, password: string, metadata: SignUpMetadata) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: metadata.fullName,
                role: metadata.role,
                user_id: metadata.userId,
            }
        }
    });

    return { user: data.user, error };
};

// Generic function to update a record in any table
export const updateRecord = async (tableName: string, recordId: string, updates: Record<string, any>) => {
    const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();
        
    return { data, error };
};

// Upload a user's avatar to Supabase Storage
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    const filePath = `${userId}/${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
    }

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

// Deletes a user by calling a Supabase RPC function.
// This is the secure way to delete a user from the client-side.
// NOTE: This requires a `delete_user` function to be created in your Supabase SQL editor.
export const deleteUser = async (userId: string) => {
    const { data, error } = await supabase.rpc('delete_user', { user_id: userId });
    return { data, error };
};
