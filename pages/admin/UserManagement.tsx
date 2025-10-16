import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { User, UserRole } from '../../types';
import CreateUserModal from '../../components/admin/CreateUserModal';
import EditUserModal from '../../components/admin/EditUserModal';
import { signUpNewUser, updateRecord, deleteUser } from '../../services/api';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import SqlInstructionModal from '../../components/admin/SqlInstructionModal';

const DELETE_USER_SQL = `CREATE OR REPLACE FUNCTION public.delete_user(user_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user calling the function is an Admin
  IF (SELECT role FROM public.users WHERE id = auth.uid()) != 'Admin' THEN
    RAISE EXCEPTION 'Only admins can delete users.';
  END IF;

  -- Perform the deletion from the master authentication table
  DELETE FROM auth.users AS u WHERE u.id = user_id;
  
  RETURN 'User deleted successfully.';
END;
$$;`;

const UserManagement: React.FC = () => {
  const [isCreateUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { users, loading, refetchUsers } = useUsers();
  const { user: currentUser } = useAuth();
  const [isSqlModalOpen, setSqlModalOpen] = useState(false);


  const handleCreateUser = async (newUser: {
    fullName: string;
    role: UserRole;
    userId: string;
    password: string;
    verified: boolean;
  }) => {
    try {
      // 1. Generate a "proxy" email for Supabase Auth, which is invisible to the user.
      const proxyEmail = `user-${newUser.userId}@amaz-interiors.app`;

      // 2. Prepare metadata to be stored in the public.users table via the trigger.
      const metadata = {
          fullName: newUser.fullName,
          role: newUser.role,
          userId: newUser.userId,
      };

      // 3. Call the Supabase Auth sign-up function.
      const { user, error: signUpError } = await signUpNewUser(proxyEmail, newUser.password, metadata);

      if (signUpError) {
          throw signUpError;
      }
      
      if (user) {
          // 4. The trigger creates the user profile, but we now explicitly set all
          // necessary fields to make the process more robust against trigger failures.
          const { error: updateError } = await updateRecord('users', user.id, {
              full_name: newUser.fullName,
              role: newUser.role,
              user_id: newUser.userId,
              verified: newUser.verified,
          });
          
          if (updateError) {
               // This is a partial failure, but we still want to refresh and close.
               // The user is created in auth but not correctly in public.users.
              alert(`User account was created, but setting the profile failed: ${updateError.message}. Please edit the user manually to set their User ID and Verified status.`);
          }
      }
      
      // 5. Refresh the user list to show the new user.
      await refetchUsers(); 
      setCreateUserModalOpen(false); // Close modal only after all operations succeed
    } catch (error) {
        alert(`Failed to create user: ${(error as Error).message}`);
        console.error(error);
        setCreateUserModalOpen(false); // Ensure modal closes even on failure
    }
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
        await refetchUsers(); // Refresh list on successful update
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    // Prevent an admin from deleting their own account
    if (currentUser && currentUser.id === userToDelete.id) {
      alert("For security reasons, you cannot delete your own account from this panel.");
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete the user "${userToDelete.fullName}"? This action is irreversible.`)) {
      const { error } = await deleteUser(userToDelete.id);

      if (error) {
        // Provide a more helpful error message if the function doesn't exist.
        if (error.message.includes('function public.delete_user(user_id) does not exist')) {
            setSqlModalOpen(true);
        } else {
            alert(`Failed to delete user: ${error.message}`);
        }
      } else {
        alert('User deleted successfully.');
        await refetchUsers();
      }
    }
  };

  return (
    <>
       <SqlInstructionModal
        isOpen={isSqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
        title="Backend Setup Required"
        instructions="The user deletion feature requires a secure function on the backend. Please run the following SQL script in your Supabase project's SQL Editor to create it."
        sqlCode={DELETE_USER_SQL}
      />
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
                {users.map((user: User, index: number) => (
                  <tr key={user.id} className={`border-t border-border-color ${index === 0 ? 'border-t-0' : ''}`}>
                    <td className="px-6 py-4 font-medium text-text-primary">
                        <UserNameDisplay user={user} showAvatar={true} textClassName="font-semibold"/>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                    <td className="px-6 py-4 font-mono text-text-secondary">{user.userId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'Admin' ? 'bg-brand-blue/20 text-brand-blue' :
                        user.role === 'Designer' ? 'bg-orange-500/20 text-orange-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                          <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => handleOpenEditModal(user)}>Edit</Button>
                          <Button variant="secondary" className="!px-3 !py-1 text-xs !border-red-500/50 hover:!bg-red-500/20 text-red-500" onClick={() => handleDeleteUser(user)}>Delete</Button>
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