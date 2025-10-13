import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MOCK_USERS } from '../../services/mockData';
import { User } from '../../types';
import CreateUserModal from '../../components/admin/CreateUserModal';

const UserManagement: React.FC = () => {
  const [isCreateUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  const handleCreateUser = (newUser: Omit<User, 'avatarUrl'>) => {
    const userToAdd: User = {
      ...newUser,
      avatarUrl: `https://i.pravatar.cc/150?u=${newUser.id}`
    };
    // In a real app, this would be an API call followed by re-fetching data.
    // Here, we update both the mock source and local state to ensure UI updates.
    MOCK_USERS.push(userToAdd);
    setUsers(prevUsers => [...prevUsers, userToAdd]);
    setCreateUserModalOpen(false);
  };

  return (
    <>
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onCreate={handleCreateUser}
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
                      <Button variant="secondary" className="px-3 py-1 text-xs">Edit</Button>
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
                  <th scope="col" className="px-6 py-3">Email</th>
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
                          <Button variant="secondary" className="px-3 py-1 text-xs">Edit</Button>
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