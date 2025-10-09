import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Key, Copy, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface ApiKey {
  id: string;
  key_name: string;
  api_key: string;
  is_active: boolean;
  requests_count: number;
  rate_limit_per_hour: number;
  last_used_at: string | null;
  created_at: string;
}

interface ApiKeyManagementProps {
  user: User | null;
}

export default function ApiKeyManagement({ user }: ApiKeyManagementProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading API keys",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateApiKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "pk_";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your API key",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const apiKey = generateApiKey();
      const { error } = await supabase.from("api_keys").insert({
        user_id: user?.id,
        key_name: newKeyName,
        api_key: apiKey,
      });

      if (error) throw error;

      toast({
        title: "API key created",
        description: "Your new API key has been generated successfully",
      });

      setNewKeyName("");
      loadApiKeys();
    } catch (error: any) {
      toast({
        title: "Error creating API key",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", keyToDelete);

      if (error) throw error;

      toast({
        title: "API key deleted",
        description: "The API key has been removed",
      });

      loadApiKeys();
    } catch (error: any) {
      toast({
        title: "Error deleting API key",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setKeyToDelete(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const maskApiKey = (key: string) => {
    return `${key.substring(0, 8)}${"•".repeat(20)}${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
          </CardTitle>
          <CardDescription>
            Create and manage API keys to integrate our prompt optimization engine into your applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Create New API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="keyName"
                  placeholder="Enter a name for your API key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <Button onClick={handleCreateKey} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Key"}
                </Button>
              </div>
            </div>
          </div>

          {apiKeys.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.key_name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          {visibleKeys.has(key.id) ? key.api_key : maskApiKey(key.api_key)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(key.id)}
                          >
                            {visibleKeys.has(key.id) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.is_active ? "default" : "secondary"}>
                          {key.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{key.requests_count.toLocaleString()}</TableCell>
                      <TableCell>{key.rate_limit_per_hour}/hour</TableCell>
                      <TableCell>
                        {key.last_used_at
                          ? new Date(key.last_used_at).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(key.api_key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setKeyToDelete(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No API keys created yet. Create your first key to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone and any
              applications using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}