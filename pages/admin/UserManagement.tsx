import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { User, UserRole } from '../../types';
import CreateUserModal from '../../components/admin/CreateUserModal';
import EditUserModal from '../../components/admin/EditUserModal';
import { getUsers, signUpNewUser, updateRecord } from '../../services/api';

const UserManagement: React.FC = () => {
  const [isCreateUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (newUser: {
    fullName: string;
    role: UserRole;
    userId: string;
    password: string;
    verified: boolean;
  }) => {
    // 1. Generate a "proxy" email for Supabase Auth, which is invisible to the user.
    // The user will only ever use their `userId` (custom ID) to log in.
    const proxyEmail = `user-${newUser.userId}@aura-interiors.app`;

    // 2. Prepare metadata to be stored in the public.users table via the trigger.
    const metadata = {
        fullName: newUser.fullName,
        role: newUser.role,
        userId: newUser.userId,
    };

    // 3. Call the Supabase Auth sign-up function.
    const { user, error } = await signUpNewUser(proxyEmail, newUser.password, metadata);

    if (error) {
        alert(`Failed to create user: ${error.message}`);
        console.error(error);
        return;
    }
    
    if (user) {
        // 4. The trigger creates the user profile, but we must manually update it
        // to set the userId (custom User ID) and the verified status.
        await updateRecord('users', user.id, {
            user_id: newUser.userId,
            verified: newUser.verified,
        });
    }

    // 5. Refresh the user list to show the new user.
    fetchUsers(); 
    setCreateUserModalOpen(false);
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    // Map camelCase from the app to snake_case for the database
    const updatesForDb: Record<string, any> = {};
    if (updates.fullName !== undefined) updatesForDb.full_name = updates.fullName;
    if (updates.role !== undefined) updatesForDb.role = updates.role;
    if (updates.userId !== undefined) updatesForDb.user_id = updates.userId;
    if (updates.verified !== undefined) updatesForDb.verified = updates.verified;

    const { error } = await updateRecord('users', userId, updatesForDb);
    if (error) {
        alert(`Failed to update user: ${error.message}`);
    } else {
        await fetchUsers(); // Refresh list on successful update
    }
  };
  
  if (loading) {
      return <div>Loading users...</div>
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
          <h1 className="text-3xl font-bold text-text-headline">User Management</h1>
          <Button onClick={() => setCreateUserModalOpen(true)}>+ Add User</Button>
        </div>
        
        <Card>
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {users.map((user: User) => (
              <div key={user.id} className="bg-primary-bg p-4 rounded-xl">
                <div className="flex items-center gap-4 mb-3">
                  <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="font-bold text-text-headline flex items-center gap-1.5">
                      {user.fullName}
                      {user.verified && (
                        <div className="verified-badge-container">
                          <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1760346718/download_thps2y.svg" alt="Verified Badge" className="w-4 h-4" />
                          <span className="verified-tooltip">Verified By Zcy</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-text-muted">{user.email}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'Admin' ? 'bg-accent/20 text-accent' :
                        user.role === 'Designer' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {user.role}
                      </span>
                  <div className="flex gap-2">
                      <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => handleOpenEditModal(user)}>Edit</Button>
                      <Button variant="secondary" className="px-3 py-1 text-xs !border-red-500/50 hover:!bg-red-500/20 text-red-400">Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted uppercase bg-primary-bg">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Email (System)</th>
                  <th scope="col" className="px-6 py-3">User ID</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: User) => (
                  <tr key={user.id} className="border-b border-border-color">
                    <td className="px-6 py-4 font-medium text-text-headline flex items-center gap-3">
                      <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full" />
                      <div className="flex items-center gap-1.5">
                        {user.fullName}
                        {user.verified && (
                          <div className="verified-badge-container">
                            <img src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1760346718/download_thps2y.svg" alt="Verified Badge" className="w-4 h-4" />
                            <span className="verified-tooltip">Verified By Zcy</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 font-mono">{user.userId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'Admin' ? 'bg-accent/20 text-accent' :
                        user.role === 'Designer' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                          <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => handleOpenEditModal(user)}>Edit</Button>
                          <Button variant="secondary" className="px-3 py-1 text-xs !border-red-500/50 hover:!bg-red-500/20 text-red-400">Delete</Button>
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