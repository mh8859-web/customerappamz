import React, { useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { User, UserRole } from '../../types';
import CreateUserModal from '../../components/admin/CreateUserModal';
import EditUserModal from '../../components/admin/EditUserModal';
import { signUpNewUser, updateRecord, deleteUser } from '../../services/api';
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
      const proxyEmail = `user-${newUser.userId}@amaz-interiors.app`;
      const metadata = {
          fullName: newUser.fullName,
          role: newUser.role,
          userId: newUser.userId,
      };

      const { user, error: signUpError } = await signUpNewUser(proxyEmail, newUser.password, metadata);

      if (signUpError) throw signUpError;
      
      if (user) {
          const { error: updateError } = await updateRecord('users', user.id, {
              full_name: newUser.fullName,
              role: newUser.role,
              user_id: newUser.userId,
              verified: newUser.verified,
          });
          
          if (updateError) {
              alert(`User account was created, but setting the profile failed: ${updateError.message}. Please edit the user manually.`);
          }
      }
      
      await refetchUsers(); 
      setCreateUserModalOpen(false);
    } catch (error) {
        alert(`Failed to create user: ${(error as Error).message}`);
        console.error(error);
        setCreateUserModalOpen(false);
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
    if (updates.userId !== undefined) updatesForDb.user_id = updates.userId;
    if (updates.verified !== undefined) updatesForDb.verified = updates.verified;

    const { error } = await updateRecord('users', userId, updatesForDb);
    if (error) {
        alert(`Failed to update user: ${error.message}`);
    } else {
        await refetchUsers();
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (currentUser && currentUser.id === userToDelete.id) {
      alert("For security reasons, you cannot delete your own account from this panel.");
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete the user "${userToDelete.fullName}"? This action is irreversible.`)) {
      const { error } = await deleteUser(userToDelete.id);

      if (error) {
        alert(`Failed to delete user. Please ensure backend functions are correctly configured or contact support.`);
        console.error("Delete user RPC error:", error);
      } else {
        alert('User deleted successfully.');
        await refetchUsers();
      }
    }
  };
  
  const handleImpersonate = (userToImpersonate: User) => {
      if (currentUser && currentUser.id === userToImpersonate.id) {
          alert("You cannot impersonate yourself.");
          return;
      }
      if (window.confirm(`You are about to view the application as ${userToImpersonate.fullName}. You will see exactly what they see. Do you want to continue?`)) {
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