
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Mail, Trash } from 'lucide-react';
import { EmailList } from '@/types/email';

export default function EmailLists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<EmailList[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newList, setNewList] = useState({
    name: '',
    emails: '',
  });

  useEffect(() => {
    loadLists();
  }, [user?.id]);

  const loadLists = () => {
    const savedLists = localStorage.getItem(`emailLists_${user?.id}`);
    if (savedLists) {
      setLists(JSON.parse(savedLists));
    }
  };

  const saveLists = (updatedLists: EmailList[]) => {
    localStorage.setItem(`emailLists_${user?.id}`, JSON.stringify(updatedLists));
    setLists(updatedLists);
  };

  const createList = () => {
    if (!newList.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter a name for the email list.",
        variant: "destructive",
      });
      return;
    }

    const emailArray = newList.emails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && isValidEmail(email));

    if (emailArray.length === 0) {
      toast({
        title: "No valid emails",
        description: "Please enter at least one valid email address.",
        variant: "destructive",
      });
      return;
    }

    const newEmailList: EmailList = {
      id: crypto.randomUUID(),
      name: newList.name,
      emails: emailArray,
      userId: user?.id || '',
      createdAt: new Date(),
    };

    saveLists([...lists, newEmailList]);
    setNewList({ name: '', emails: '' });
    setShowCreateForm(false);
    
    toast({
      title: "List created",
      description: `Email list "${newList.name}" created with ${emailArray.length} emails.`,
    });
  };

  const deleteList = (listId: string) => {
    const updatedLists = lists.filter(list => list.id !== listId);
    saveLists(updatedLists);
    toast({
      title: "List deleted",
      description: "Email list has been deleted successfully.",
    });
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Email Lists</h1>
          <p className="text-gray-600">Manage your email subscriber lists</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New List
        </Button>
      </div>

      {/* Create List Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Email List</CardTitle>
            <CardDescription>Add a new list of email subscribers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                placeholder="e.g., Newsletter Subscribers, Customers, Leads"
                value={newList.name}
                onChange={(e) => setNewList({ ...newList, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-addresses">Email Addresses</Label>
              <Textarea
                id="email-addresses"
                placeholder="Enter email addresses, one per line:&#10;john@example.com&#10;jane@example.com&#10;..."
                rows={8}
                value={newList.emails}
                onChange={(e) => setNewList({ ...newList, emails: e.target.value })}
              />
              <p className="text-sm text-gray-500">
                Enter one email address per line. Invalid emails will be automatically filtered out.
              </p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={createList}>Create List</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map((list) => (
          <Card key={list.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{list.name}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteList(list.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {list.emails.length} subscribers
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(list.createdAt).toLocaleDateString()}
                </div>
                <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-gray-700 mb-2">Email addresses:</p>
                  <div className="space-y-1">
                    {list.emails.slice(0, 5).map((email, index) => (
                      <p key={index} className="text-xs text-gray-600">{email}</p>
                    ))}
                    {list.emails.length > 5 && (
                      <p className="text-xs text-gray-500">...and {list.emails.length - 5} more</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lists.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No email lists yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first email list to start building your subscriber base.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First List
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
