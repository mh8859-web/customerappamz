import React, { useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { User, UserRole } from '../../types';
import CreateUserModal from '../../components/admin/CreateUserModal';
import EditUserModal from '../../components/admin/EditUserModal';
import { signUpNewUser, upsertRecord, deleteUser } from '../../services/api';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import { EyeIcon } from '../../components/icons';

const UserManagement: React.FC = () => {
  const [isCreateUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { users, loading, refetchUsers } = useUsers();
  const { user: currentUser, startImpersonation } = useAuth();

  const filteredUsers = useMemo(() => {
    if (currentUser?.role === 'Sub-Admin') {
      return users.filter(user => user.role !== 'Admin');
    }
    return users;
  }, [users, currentUser]);

  const handleCreateUser = async (u: any) => {
    try {
        // Step 1: Attempt to create Auth Identity
        const { user: newUser, error: authError } = await signUpNewUser(u.email, u.password, {
            fullName: u.fullName,
            role: u.role,
            userId: u.userId
        });

        if (authError) {
            alert(`Provisioning Failed: ${authError.message}`);
            return;
        }

        // Step 2: Manually Ensure Public Profile
        // We use upsertRecord to ensure that even if a trigger is slow, the profile is registered NOW.
        if (newUser) {
             const { error: profileError } = await upsertRecord('users', {
                 id: newUser.id,
                 email: u.email.toLowerCase(),
                 full_name: u.fullName,
                 role: u.role,
                 user_id: u.userId.toLowerCase(),
                 verified: !!u.verified
             });
             
             if (profileError) {
                 console.error("Profile Manual Sync Failed:", profileError);
                 alert(`Warning: Account created, but profile sync failed: ${profileError.message}. The user might not appear in the list immediately.`);
             }
        }

        // Step 3: Refresh the list and close
        await refetchUsers();
        setCreateUserModalOpen(false);
        alert(`Success: Identity for ${u.fullName} has been provisioned.`);

    } catch (err: any) {
        alert(`An unexpected system error occurred: ${err.message || 'Unknown error'}`);
        console.error(err);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    const updatesForDb: Record<string, any> = {};
    if (updates.fullName !== undefined) updatesForDb.full_name = updates.fullName;
    if (updates.role !== undefined) updatesForDb.role = updates.role;
    if (updates.verified !== undefined) updatesForDb.verified = updates.verified;

    const { error } = await upsertRecord('users', { id: userId, ...updatesForDb });
    if (error) alert(`Update Failed: ${error.message}`);
    else await refetchUsers();
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (currentUser?.id === userToDelete.id) return alert("Security: Cannot void your own identity.");
    if (window.confirm(`Permanently void identity "${userToDelete.fullName}"? This is irreversible.`)) {
      const { error } = await deleteUser(userToDelete.id);
      if (error) alert(`Error: ${error.message}`);
      else await refetchUsers();
    }
  };
  
  const handleImpersonate = (user: User) => {
      if (currentUser?.id === user.id) return;
      if (window.confirm(`Switch context to view workspace as ${user.fullName}?`)) startImpersonation(user);
  }

  return (
    <>
      <CreateUserModal 
        isOpen={isCreateUserModalOpen} 
        onClose={() => setCreateUserModalOpen(false)} 
        onCreate={handleCreateUser} 
      />
      <EditUserModal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} user={selectedUser} onUpdate={handleUpdateUser} />
      
      <div className="space-y-6 animate-in">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Identity Management</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Global Directory Control</p>
          </div>
          <Button onClick={() => setCreateUserModalOpen(true)} className="!px-6 !py-3 !rounded-xl !bg-slate-900 !text-[11px] !font-black !tracking-widest uppercase shadow-button">
            + Provision ID
          </Button>
        </div>
        
        <Card className="!p-0 !rounded-3xl border-slate-200 shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[2px] text-slate-400">Entity</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[2px] text-slate-400">Identity Key</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[2px] text-slate-400">Permission Level</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[2px] text-slate-400 text-right">Commands</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                    <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Syncing Directory...</td>
                    </tr>
                ) : filteredUsers.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">No Identities Found</td>
                    </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-3">
                          <UserNameDisplay user={user} showAvatar={true} textClassName="font-bold text-slate-800 text-sm" imageSize="w-8 h-8"/>
                      </td>
                      <td className="px-6 py-3 font-mono text-[11px] text-slate-400">{user.userId}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          user.role === 'Admin' ? 'bg-brand-blue/10 text-brand-blue' :
                          user.role === 'Designer' ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>{user.role}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleImpersonate(user)} className="p-2 text-slate-400 hover:text-brand-blue rounded-lg transition-colors" title="Impersonate">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleOpenEditModal(user)} className="px-3 py-2 text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors">Edit</button>
                            <button onClick={() => handleDeleteUser(user)} className="px-3 py-2 text-slate-300 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors">Void</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
};

export default UserManagement;