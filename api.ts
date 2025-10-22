import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

interface SignUpMetadata {
    fullName: string;
    role: UserRole;
    userId: string;
}

// Fetch all users from the public 'users' table
export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return data.map(user => ({
        id: user.id,
        fullName: user.full_name || 'Unnamed User',
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url || 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp',
        verified: !!user.verified,
        verificationRequested: !!user.verification_requested,
        userId: user.user_id || '',
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

// Generic function to create a new record in any table
export const createRecord = async (tableName: string, recordData: Record<string, any>) => {
    const { data, error } = await supabase
        .from(tableName)
        .insert(recordData)
        .select()
        .single();
    return { data, error };
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

// Generic function to delete a record by ID from any table
export const deleteRecord = async (tableName: string, recordId: string) => {
    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);
    return { error };
};

// Upload a user's avatar to Supabase Storage
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    const filePath = `public/${userId}/${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
    }

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

// Upload a generic project file (quote, design, etc.)
export const uploadProjectFile = async (projectId: string, file: File): Promise<string | null> => {
    const filePath = `${projectId}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
        .from('project_files')
        .upload(filePath, file);

    if (error) {
        console.error('Error uploading project file:', error);
        return null;
    }

    const { data } = supabase.storage
        .from('project_files')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

// Update the current user's password
export const updateUserPassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
};

// NEW: (MOCKED) Admin function to update another user's password
// In a real app, this would call a secure Supabase Edge Function.
export const adminUpdateUserPassword = async (userId: string, newPassword: string) => {
    console.log(`[MOCK API] Admin is changing password for user ${userId}. New password: ${newPassword}`);
    // This would be: await supabase.functions.invoke('change-user-password', { body: { userId, newPassword } });
    return { error: null };
};


// Deletes a user by calling a Supabase RPC function.
export const deleteUser = async (userId: string) => {
    const { data, error } = await supabase.rpc('delete_user', { user_id: userId });
    return { data, error };
};