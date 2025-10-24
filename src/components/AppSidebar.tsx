import React from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  LogOut,
  User as UserIcon,
  Home,
  LayoutDashboard,
  Zap,
  TrendingUp,
  Store,
  Plug,
  Settings,
  Layers,
  Bot,
  FileText,
  History,
  Workflow as WorkflowIcon,
  Scale,
  Key,
  BarChart3,
  ShieldCheck,
  Target,
  Beaker,
  Users,
  Building2,
  UsersRound,
  ChevronRight,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  user?: User | null;
}

const mainNavItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Agents', path: '/agents', icon: Zap },
  { name: 'Analytics', path: '/analytics', icon: TrendingUp },
  { name: 'Marketplace', path: '/marketplace', icon: Store },
  { name: 'Integrations', path: '/integrations', icon: Plug },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const accountItems = [
  { name: 'Profile', path: '/profile', icon: UserIcon },
  { name: 'Pricing', path: '/pricing', icon: TrendingUp },
];

const toolsItems = [
  { name: 'Visual Builder', path: '/visual-builder', icon: Layers },
  { name: 'AI Co-Pilot', path: '/ai-copilot', icon: Bot },
  { name: 'Templates', path: '/templates', icon: FileText },
  { name: 'History', path: '/history', icon: History },
  { name: 'Workflow', path: '/workflow', icon: WorkflowIcon },
  { name: 'Legal Packs', path: '/legal-packs', icon: Scale },
];

const settingsItems = [
  { name: 'API Keys', path: '/api-keys', icon: Key },
  { name: 'Usage', path: '/usage', icon: BarChart3 },
  { name: 'Compliance', path: '/compliance-dashboard', icon: ShieldCheck },
];

const advancedItems = [
  { name: 'Benchmark', path: '/benchmark', icon: Target },
  { name: 'Optimization Lab', path: '/optimization-lab', icon: Beaker },
];

const connectItems = [
  { name: 'Community', path: '/community', icon: Users },
  { name: 'Enterprise', path: '/enterprise', icon: Building2 },
  { name: 'Team', path: '/team', icon: UsersRound },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentPath = window.location.pathname;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    } else {
      navigate('/auth');
    }
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-800/40 bg-gradient-to-b from-black via-zinc-950 to-black shadow-2xl shadow-black/50 h-screen">
      {/* Header */}
      <SidebarHeader className="border-b border-zinc-800/40 bg-gradient-to-br from-zinc-900/40 via-zinc-900/20 to-transparent px-5 py-6 flex-shrink-0 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => navigate('/')}
              className="group-data-[collapsible=icon]:!p-2 hover:bg-zinc-900/60 transition-all duration-500 rounded-xl"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white via-zinc-50 to-zinc-100 shadow-xl shadow-white/25 transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-white/40 group-hover:rotate-3">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Sparkles className="h-5 w-5 text-black relative z-10" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-1.5 leading-none">
                <span className="text-lg font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-zinc-200 bg-clip-text">PrompX</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">AI Engineering</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-3 py-6 flex-1 overflow-y-auto">
        {/* Main Navigation */}
        <SidebarGroup className="mb-8">
          <SidebarGroupLabel className="px-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
            <span>Main</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={active}
                      tooltip={item.name}
                      className={`relative px-4 py-3.5 rounded-xl transition-all duration-500 group overflow-hidden ${
                        active
                          ? 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-xl shadow-zinc-900/60 border border-zinc-700/50'
                          : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/50'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                      <Icon className={`h-5 w-5 transition-all duration-300 relative z-10 ${active ? 'text-white drop-shadow-lg' : 'text-zinc-500 group-hover:text-white group-hover:scale-110'}`} />
                      <span className="font-bold text-base relative z-10">{item.name}</span>
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-white via-zinc-300 to-white rounded-r-full shadow-lg shadow-white/50" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account */}
        <Collapsible defaultOpen className="group/collapsible mb-8">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-all duration-300 mb-4 flex items-center gap-2 group">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
                <span>Account</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-all duration-500 group-data-[state=open]/collapsible:rotate-90 group-hover:text-zinc-300" />
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {accountItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={active}
                          tooltip={item.name}
                          className={`relative px-4 py-3.5 rounded-xl transition-all duration-500 group overflow-hidden ${
                            active
                              ? 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-xl shadow-zinc-900/60 border border-zinc-700/50'
                              : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/50'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                          <Icon className={`h-5 w-5 transition-all duration-300 relative z-10 ${active ? 'text-white drop-shadow-lg' : 'text-zinc-500 group-hover:text-white group-hover:scale-110'}`} />
                          <span className="font-bold text-base relative z-10">{item.name}</span>
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-white via-zinc-300 to-white rounded-r-full shadow-lg shadow-white/50" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Tools */}
        <Collapsible defaultOpen className="group/collapsible mb-8">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-all duration-300 mb-4 flex items-center gap-2 group">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
                <span>Tools</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-all duration-500 group-data-[state=open]/collapsible:rotate-90 group-hover:text-zinc-300" />
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {toolsItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={active}
                          tooltip={item.name}
                          className={`relative px-4 py-3.5 rounded-xl transition-all duration-500 group overflow-hidden ${
                            active
                              ? 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-xl shadow-zinc-900/60 border border-zinc-700/50'
                              : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/50'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                          <Icon className={`h-5 w-5 transition-all duration-300 relative z-10 ${active ? 'text-white drop-shadow-lg' : 'text-zinc-500 group-hover:text-white group-hover:scale-110'}`} />
                          <span className="font-bold text-base relative z-10">{item.name}</span>
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-white via-zinc-300 to-white rounded-r-full shadow-lg shadow-white/50" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Settings */}
        <Collapsible className="group/collapsible mb-8">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-all duration-300 mb-4 flex items-center gap-2 group">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
                <span>Settings</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-all duration-500 group-data-[state=open]/collapsible:rotate-90 group-hover:text-zinc-300" />
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {settingsItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={active}
                          tooltip={item.name}
                          className={`relative px-4 py-3.5 rounded-xl transition-all duration-500 group overflow-hidden ${
                            active
                              ? 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-xl shadow-zinc-900/60 border border-zinc-700/50'
                              : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/50'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                          <Icon className={`h-5 w-5 transition-all duration-300 relative z-10 ${active ? 'text-white drop-shadow-lg' : 'text-zinc-500 group-hover:text-white group-hover:scale-110'}`} />
                          <span className="font-bold text-base relative z-10">{item.name}</span>
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-white via-zinc-300 to-white rounded-r-full shadow-lg shadow-white/50" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Advanced */}
        <Collapsible className="group/collapsible mb-8">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-all duration-300 mb-4 flex items-center gap-2 group">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
                <span>Advanced</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-all duration-500 group-data-[state=open]/collapsible:rotate-90 group-hover:text-zinc-300" />
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {advancedItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={active}
                          tooltip={item.name}
                          className={`relative px-4 py-3.5 rounded-xl transition-all duration-500 group overflow-hidden ${
                            active
                              ? 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-xl shadow-zinc-900/60 border border-zinc-700/50'
                              : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/50'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                          <Icon className={`h-5 w-5 transition-all duration-300 relative z-10 ${active ? 'text-white drop-shadow-lg' : 'text-zinc-500 group-hover:text-white group-hover:scale-110'}`} />
                          <span className="font-bold text-base relative z-10">{item.name}</span>
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-white via-zinc-300 to-white rounded-r-full shadow-lg shadow-white/50" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Connect */}
        <Collapsible className="group/collapsible mb-8">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="px-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-all duration-300 mb-4 flex items-center gap-2 group">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
                <span>Connect</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-all duration-500 group-data-[state=open]/collapsible:rotate-90 group-hover:text-zinc-300" />
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {connectItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={active}
                          tooltip={item.name}
                          className={`relative px-4 py-3.5 rounded-xl transition-all duration-500 group overflow-hidden ${
                            active
                              ? 'bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-xl shadow-zinc-900/60 border border-zinc-700/50'
                              : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800/50'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`}></div>
                          <Icon className={`h-5 w-5 transition-all duration-300 relative z-10 ${active ? 'text-white drop-shadow-lg' : 'text-zinc-500 group-hover:text-white group-hover:scale-110'}`} />
                          <span className="font-bold text-base relative z-10">{item.name}</span>
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-white via-zinc-300 to-white rounded-r-full shadow-lg shadow-white/50" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-zinc-800/40 bg-gradient-to-t from-zinc-900/40 via-zinc-900/20 to-transparent px-4 py-5 flex-shrink-0 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton 
                    size="lg" 
                    className="data-[state=open]:bg-zinc-900/60 hover:bg-zinc-900/60 transition-all duration-500 rounded-xl px-4 py-3 border border-transparent hover:border-zinc-800/50 group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 shadow-xl shadow-zinc-900/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 relative z-10 border border-zinc-700/50">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col gap-1 leading-none text-left flex-1 relative z-10">
                      <span className="font-extrabold text-sm truncate max-w-[150px] text-white">
                        {user.email}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">Signed in</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  side="top" 
                  className="w-[--radix-popper-anchor-width] bg-gradient-to-br from-black via-zinc-950 to-black border-zinc-800/60 shadow-2xl backdrop-blur-xl rounded-xl p-2"
                >
                  <DropdownMenuItem 
                    onClick={() => navigate('/profile')}
                    className="cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-900/80 transition-all duration-300 rounded-lg px-3 py-2.5 font-semibold"
                  >
                    <UserIcon className="mr-3 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/settings')}
                    className="cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-900/80 transition-all duration-300 rounded-lg px-3 py-2.5 font-semibold"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-2"></div>
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-all duration-300 rounded-lg px-3 py-2.5 font-semibold"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="hover:bg-zinc-900/60 transition-all duration-500 rounded-xl px-4 py-3 border border-transparent hover:border-zinc-800/50 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white via-zinc-50 to-zinc-100 shadow-xl shadow-white/25 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 relative z-10">
                  <UserIcon className="h-5 w-5 text-black" />
                </div>
                <div className="flex flex-col gap-1 leading-none relative z-10">
                  <span className="font-extrabold text-white">Sign In</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">Get started</span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
