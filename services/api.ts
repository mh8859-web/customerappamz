
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

// --- SUPABASE STORAGE CONFIGURATION ---
const STORAGE_BUCKET = 'amaz-storage';

interface SignUpMetadata {
    fullName: string;
    role: UserRole;
    userId: string;
}

export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return (data || []).map(user => ({
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

export const createRecord = async (tableName: string, recordData: Record<string, any>) => {
    const { data, error } = await supabase
        .from(tableName)
        .insert(recordData)
        .select()
        .single();
    return { data, error };
};

export const updateRecord = async (tableName: string, recordId: string, updates: Record<string, any>) => {
    const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();
    return { data, error };
};

export const upsertRecord = async (tableName: string, recordData: Record<string, any>) => {
    const { data, error } = await supabase
        .from(tableName)
        .upsert(recordData, { onConflict: 'id' })
        .select()
        .single();
    return { data, error };
};

export const deleteRecord = async (tableName: string, recordId: string) => {
    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);
    return { error };
};

/**
 * Core Supabase Storage Upload Logic
 */
async function uploadToSupabase(path: string, file: File): Promise<string | null> {
    try {
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('[SUPABASE UPLOAD ERROR]', error);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);

        return publicUrl;
    } catch (err) {
        console.error('[UPLOAD EXCEPTION]', err);
        return null;
    }
}

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    const path = `avatars/${userId}/${Date.now()}_${file.name}`;
    return uploadToSupabase(path, file);
};

export const uploadProjectFile = async (projectId: string, file: File): Promise<string | null> => {
    const path = `projects/${projectId}/${Date.now()}_${file.name}`;
    return uploadToSupabase(path, file);
};

export const uploadPostMedia = async (userId: string, file: File): Promise<string | null> => {
    const path = `posts/${userId}/${Date.now()}_${file.name}`;
    return uploadToSupabase(path, file);
};

export const uploadChatAttachment = async (projectId: string, userId: string, file: File): Promise<string | null> => {
    const path = `chats/${projectId}/${userId}/${Date.now()}_${file.name}`;
    return uploadToSupabase(path, file);
};

export const updateUserPassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
};

export const adminUpdateUserPassword = async (userId: string, newPassword: string) => {
    const { data, error } = await supabase.rpc('admin_set_user_password', {
        user_id: userId,
        new_password: newPassword,
    });
    return { data, error };
};

export const deleteUser = async (userId: string) => {
    const { data, error } = await supabase.rpc('delete_user', { user_id: userId });
    return { data, error };
};

export const startClockIn = async (designerId: string, clockInTime: string, location: string, ipAddress: string) => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .insert({
            designer_id: designerId,
            clock_in: clockInTime,
            location: location,
            ip_address: ipAddress
        })
        .select()
        .single();
    return { data, error };
};

export const endClockOut = async (logId: string, clockOutTime: string, duration: string, workSummary: string) => {
    const { data, error } = await supabase
        .from('attendance_logs')
        .update({
            clock_out: clockOutTime,
            duration: duration,
            work_summary: workSummary
        })
        .eq('id', logId)
        .select()
        .single();
    return { data, error };
};
