
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

// Robust function to handle both insert and update
export const upsertRecord = async (tableName: string, recordData: Record<string, any>) => {
    const { data, error } = await supabase
        .from(tableName)
        .upsert(recordData, { onConflict: 'id' })
        .select()
        .single();
    return { data, error };
};

// Generic function to delete a record by ID
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

// --- FIX: Using 'project_files' bucket name. USER MUST CREATE THIS BUCKET IN SUPABASE DASHBOARD ---
export const uploadProjectFile = async (projectId: string, file: File): Promise<string | null> => {
    const filePath = `${projectId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from('project_files')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading project file:', uploadError);
        return null;
    }

    const { data } = supabase.storage
        .from('project_files')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

// Upload media for a community post
export const uploadPostMedia = async (userId: string, file: File): Promise<string | null> => {
    const filePath = `public/${userId}/posts/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from('project_files') 
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading post media:', uploadError);
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

// Admin function to update another user's password
export const adminUpdateUserPassword = async (userId: string, newPassword: string) => {
    const { data, error } = await supabase.rpc('admin_set_user_password', {
        user_id: userId,
        new_password: newPassword,
    });
    return { data, error };
};

// Deletes a user
export const deleteUser = async (userId: string) => {
    const { data, error } = await supabase.rpc('delete_user', { user_id: userId });
    return { data, error };
};

// API call to start a clock-in record
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

// API call to end a clock-out record
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

// Upload a file for a chat message
export const uploadChatAttachment = async (projectId: string, userId: string, file: File): Promise<string | null> => {
    const filePath = `${projectId}/chat/${userId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from('project_files') 
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading chat attachment:', uploadError);
        return null;
    }

    const { data } = supabase.storage
        .from('project_files')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export const deleteProjectAndRelatedData = async (projectId: string) => {
    const relatedTables = [
        'tasks', 'designs', 'milestones', 'quotes', 'activity_logs', 
        'site_visits', 'support_tickets', 'work_logs', 'project_updates', 
        'final_gallery_images', 'expenses', 'products'
    ];

    const deletePromises = relatedTables.map(table => 
        supabase.from(table).delete().eq('project_id', projectId)
    );
    
    deletePromises.push(supabase.from('messages').delete().eq('chat_id', projectId));

    const results = await Promise.all(deletePromises);

    const errorResult = results.find(res => res.error);
    if (errorResult) {
        console.error("Error deleting related project data:", errorResult.error);
        return { error: errorResult.error };
    }

    const { error: projectDeleteError } = await supabase.from('projects').delete().eq('id', projectId);

    if (projectDeleteError) {
        console.error("Error deleting project:", projectDeleteError);
        return { error: projectDeleteError };
    }

    return { error: null };
};
