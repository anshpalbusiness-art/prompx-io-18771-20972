import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, FileText } from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
  totalUsers: number;
  totalSubscriptions: number;
  planBreakdown: { plan_name: string; count: number; revenue: number }[];
  promptUsage: { total: number; byUser: { user_id: string; count: number; email: string }[] };
  recentPrompts: { id: string; user_email: string; prompt: string; created_at: string; platform: string }[];
}

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error || !roleData) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      loadDashboardStats();
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const loadDashboardStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total active subscriptions
      const { data: subscriptions, count: totalSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(plan_name, price_monthly)', { count: 'exact' })
        .eq('status', 'active');

      // Calculate plan breakdown
      const planBreakdown = subscriptions?.reduce((acc: any[], sub: any) => {
        const planName = sub.subscription_plans?.plan_name || 'Unknown';
        const price = sub.subscription_plans?.price_monthly || 0;
        
        const existing = acc.find(p => p.plan_name === planName);
        if (existing) {
          existing.count++;
          existing.revenue += price;
        } else {
          acc.push({ plan_name: planName, count: 1, revenue: price });
        }
        return acc;
      }, []) || [];

      // Get prompt usage stats
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('user_id, count')
        .eq('resource_type', 'prompt_optimization');

      const totalPrompts = usageData?.reduce((sum, u) => sum + u.count, 0) || 0;
      
      // Get usage by user with email
      const userUsage = usageData?.reduce((acc: any[], u) => {
        const existing = acc.find(item => item.user_id === u.user_id);
        if (existing) {
          existing.count += u.count;
        } else {
          acc.push({ user_id: u.user_id, count: u.count });
        }
        return acc;
      }, []) || [];

      // Get user emails for usage data
      const userIds = userUsage.map(u => u.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const byUser = userUsage.map(u => ({
        ...u,
        email: profiles?.find(p => p.id === u.user_id)?.email || 'Unknown'
      })).sort((a, b) => b.count - a.count);

      // Get recent prompts
      const { data: recentPrompts } = await supabase
        .from('prompt_history')
        .select('id, user_id, original_prompt, created_at, platform')
        .order('created_at', { ascending: false })
        .limit(20);

      // Add user emails to recent prompts
      const promptUserIds = recentPrompts?.map(p => p.user_id) || [];
      const { data: promptProfiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', promptUserIds);

      const recentPromptsWithEmail = recentPrompts?.map(p => ({
        id: p.id,
        user_email: promptProfiles?.find(pr => pr.id === p.user_id)?.email || 'Unknown',
        prompt: p.original_prompt,
        created_at: p.created_at,
        platform: p.platform || 'N/A'
      })) || [];

      setStats({
        totalUsers: totalUsers || 0,
        totalSubscriptions: totalSubscriptions || 0,
        planBreakdown,
        promptUsage: { total: totalPrompts, byUser },
        recentPrompts: recentPromptsWithEmail
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error("Failed to load dashboard statistics");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-subtle">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout user={user}>
      <div className="w-full min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto max-w-7xl py-8 px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-gradient">Admin Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive platform analytics and user insights</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Paid plans</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.planBreakdown.reduce((sum, p) => sum + p.revenue, 0) || 0}/mo
                </div>
                <p className="text-xs text-muted-foreground mt-1">Monthly recurring</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.promptUsage.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Optimizations run</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tables */}
          <Tabs defaultValue="subscriptions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="usage">Usage Stats</TabsTrigger>
              <TabsTrigger value="prompts">Recent Prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Breakdown</CardTitle>
                  <CardDescription>Active subscriptions by plan type</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan Name</TableHead>
                        <TableHead className="text-right">Subscribers</TableHead>
                        <TableHead className="text-right">Monthly Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.planBreakdown.map((plan) => (
                        <TableRow key={plan.plan_name}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{plan.plan_name}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{plan.count}</TableCell>
                          <TableCell className="text-right">${plan.revenue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Prompt Usage by User</CardTitle>
                  <CardDescription>Top users by optimization count</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Email</TableHead>
                        <TableHead className="text-right">Prompts Optimized</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.promptUsage.byUser.slice(0, 20).map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell className="text-right">{user.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompts" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Prompts</CardTitle>
                  <CardDescription>Latest prompt optimizations across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Prompt</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.recentPrompts.map((prompt) => (
                        <TableRow key={prompt.id}>
                          <TableCell className="font-medium">{prompt.user_email}</TableCell>
                          <TableCell className="max-w-md truncate">{prompt.prompt}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{prompt.platform}</Badge>
                          </TableCell>
                          <TableCell>{new Date(prompt.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
