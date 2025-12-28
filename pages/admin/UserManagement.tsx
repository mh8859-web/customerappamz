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

  // Filter users based on role. Sub-Admins cannot see Admins.
  const filteredUsers = useMemo(() => {
    if (currentUser?.role === 'Sub-Admin') {
      return users.filter(user => user.role !== 'Admin');
    }
    return users;
  }, [users, currentUser]);

  const handleCreateUser = async (newUser: {
    fullName: string;
    role: UserRole;
    userId: string;
    password: string;
    verified: boolean;
  }) => {
    try {
      // Clean the User ID: remove spaces and special characters
      const cleanId = newUser.userId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
      
      // Use a more standard domain format to pass Supabase Auth validation
      const proxyEmail = `u${cleanId}@amazinteriors.com`;
      
      const metadata = {
          fullName: newUser.fullName,
          role: newUser.role,
          userId: newUser.userId,
      };

      console.log("Attempting to create Auth account:", proxyEmail);

      const { user, error: signUpError } = await signUpNewUser(proxyEmail, newUser.password, metadata);

      if (signUpError) {
          console.error("Auth Exception:", signUpError);
          
          // Better error messaging for common Supabase configuration issues
          if (signUpError.message.includes("Database error saving new user")) {
            alert("Trigger Error: The Supabase trigger failed to sync the profile. Please check the SQL Editor logs.");
          } else if (signUpError.message.includes("invalid")) {
            alert(`Format Error: The generated email "${proxyEmail}" was rejected. Ensure the User ID contains only letters and numbers.`);
          } else {
            alert(`Signup Error: ${signUpError.message}`);
          }
          return;
      }
      
      if (user) {
          // Robust manual sync to ensure public profile exists even if trigger has delay
          const { error: upsertError } = await upsertRecord('users', {
              id: user.id,
              email: proxyEmail,
              full_name: newUser.fullName,
              role: newUser.role,
              user_id: newUser.userId,
              verified: newUser.verified,
          });
          
          if (upsertError) {
              console.warn("Manual sync notice:", upsertError.message);
          }
      }
      
      await refetchUsers(); 
      setCreateUserModalOpen(false);
      alert("User created successfully!");
    } catch (error) {
        alert(`System Failure: ${(error as Error).message}`);
        console.error(error);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    const updatesForDb: Record<string, any> = { id: userId };
    if (updates.fullName !== undefined) updatesForDb.full_name = updates.fullName;
    if (updates.role !== undefined) updatesForDb.role = updates.role;
    if (updates.userId !== undefined) updatesForDb.user_id = updates.userId;
    if (updates.verified !== undefined) updatesForDb.verified = updates.verified;

    const { error } = await upsertRecord('users', updatesForDb);
    if (error) {
        alert(`Failed to update user: ${error.message}`);
    } else {
        await refetchUsers();
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (currentUser && currentUser.id === userToDelete.id) {
      alert("Self-deletion is restricted for security.");
      return;
    }

    if (window.confirm(`Permanently delete "${userToDelete.fullName}"?`)) {
      const { error } = await deleteUser(userToDelete.id);

      if (error) {
        alert(`Deletion failed. Ensure the 'delete_user' function is active in Supabase.`);
        console.error("RPC Delete Error:", error);
      } else {
        alert('User removed.');
        await refetchUsers();
      }
    }
  };
  
  const handleImpersonate = (userToImpersonate: User) => {
      if (currentUser && currentUser.id === userToImpersonate.id) return;
      if (window.confirm(`View app as ${userToImpersonate.fullName}?`)) {
          startImpersonation(userToImpersonate);
      }
  }

  return (
    <>
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onCreate={handleCreateUser}
      />
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={selectedUser}
        onUpdate={handleUpdateUser}
      />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold font-display text-text-primary">User Management</h1>
          <Button onClick={() => setCreateUserModalOpen(true)}>+ Add User</Button>
        </div>
        
        <Card className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-secondary uppercase">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Email (System)</th>
                  <th scope="col" className="px-6 py-4 font-semibold">User ID</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Role</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: User, index: number) => (
                  <tr key={user.id} className={`border-t border-border-color ${index === 0 ? 'border-t-0' : ''}`}>
                    <td className="px-6 py-4 font-medium text-text-primary">
                        <UserNameDisplay user={user} showAvatar={true} textClassName="font-semibold"/>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                    <td className="px-6 py-4 font-mono text-text-secondary">{user.userId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'Admin' ? 'bg-brand-blue/20 text-brand-blue' :
                        user.role === 'Sub-Admin' ? 'bg-purple-500/20 text-purple-500' :
                        user.role === 'Designer' ? 'bg-orange-500/20 text-orange-500' :
                        user.role === 'Accounts' ? 'bg-teal-500/20 text-teal-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                          <Button variant="secondary" title="View as User" className="!px-2 !py-1 text-xs" onClick={() => handleImpersonate(user)} disabled={currentUser?.id === user.id}>
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => handleOpenEditModal(user)}>Edit</Button>
                          <Button variant="secondary" className="!px-3 !py-1 text-xs !border-red-500/50 hover:!bg-red-500/20 text-red-500" onClick={() => handleDeleteUser(user)} disabled={currentUser?.id === user.id}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
};

export default UserManagement;