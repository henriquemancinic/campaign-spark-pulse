
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, User, Clock } from 'lucide-react';

export default function AdminPanel() {
  const { getAllUsers, updateTokenExpiry } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const { toast } = useToast();

  const users = getAllUsers();

  const handleUpdateExpiry = async () => {
    if (!selectedUser || !newExpiryDate) {
      toast({
        title: "Missing information",
        description: "Please select a user and set an expiry date.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await updateTokenExpiry(selectedUser, new Date(newExpiryDate));
      if (success) {
        toast({
          title: "Token updated",
          description: "User token expiry has been updated successfully.",
        });
        setSelectedUser('');
        setNewExpiryDate('');
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update token expiry.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the token.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage user accounts and token expiration dates</p>
      </div>

      {/* Users Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>All Users</span>
          </CardTitle>
          <CardDescription>Overview of all registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Company: {user.company}</p>
                      <p>CPF: {user.cpf}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Expires: {new Date(user.tokenExpiry).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Token Management</span>
          </CardTitle>
          <CardDescription>Update user token expiration dates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User</Label>
            <select
              id="user-select"
              className="w-full p-2 border rounded-md"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} (@{user.username})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-date">New Expiry Date</Label>
            <Input
              id="expiry-date"
              type="datetime-local"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
            />
          </div>

          <Button onClick={handleUpdateExpiry} className="w-full">
            Update Token Expiry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
