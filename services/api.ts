
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// --- CLOUDFLARE R2 CONFIGURATION (LIVE) ---
const R2_ACCOUNT_ID = 'f3d381013fa9b31d787da241193ddd1b'; 
const R2_ACCESS_KEY = '717fefd81967b09d29ea328eee3c2d71';
const R2_SECRET_KEY = '37ad94b5d191f9ef839d47e92b283fda01f2f74c1dc48a0a92eab8ae6feaae8e';
const R2_BUCKET_NAME = 'amzmyaccount';
const R2_PUBLIC_URL = `https://pub-7c8cbe3e82494966951800abd7c1d18b.r2.dev`;

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY,
        secretAccessKey: R2_SECRET_KEY,
    },
    // Explicitly disable the default credential provider chain which looks for files (Node-only)
    // This fixed the "fs.readFile is not implemented" error
    forcePathStyle: true,
});

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
 * Core R2 Upload Logic
 */
async function uploadToR2(path: string, file: File): Promise<string | null> {
    try {
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: path,
            Body: file,
            ContentType: file.type,
        });

        await s3Client.send(command);
        return `${R2_PUBLIC_URL}/${path}`;
    } catch (err) {
        console.error('[R2 UPLOAD ERROR]', err);
        return null;
    }
}

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    const path = `avatars/${userId}/${Date.now()}_${file.name}`;
    return uploadToR2(path, file);
};

export const uploadProjectFile = async (projectId: string, file: File): Promise<string | null> => {
    const path = `projects/${projectId}/${Date.now()}_${file.name}`;
    return uploadToR2(path, file);
};

export const uploadPostMedia = async (userId: string, file: File): Promise<string | null> => {
    const path = `posts/${userId}/${Date.now()}_${file.name}`;
    return uploadToR2(path, file);
};

export const uploadChatAttachment = async (projectId: string, userId: string, file: File): Promise<string | null> => {
    const path = `chats/${projectId}/${userId}/${Date.now()}_${file.name}`;
    return uploadToR2(path, file);
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
