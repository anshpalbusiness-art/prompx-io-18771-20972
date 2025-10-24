import React, { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  LogOut, 
  Menu, 
  ChevronDown, 
  User as UserIcon, 
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
  Home,
  LayoutDashboard,
  Zap,
  TrendingUp,
  Store,
  Plug,
  Settings
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  user?: User | null;
}

const navLinks = [
  { name: 'HOME', path: '/' },
  { name: 'DASHBOARD', path: '/dashboard' },
  { name: 'AI AGENTS', path: '/agents' },
  { name: 'ANALYTICS', path: '/analytics' },
  { name: 'MARKETPLACE', path: '/marketplace' },
  { name: 'INTEGRATIONS', path: '/integrations' },
  { name: 'SETTINGS', path: '/settings' },
];

const moreItems = {
  account: [
    { name: 'Profile', path: '/profile', icon: UserIcon },
    { name: 'Pricing', path: '/pricing', icon: TrendingUp },
  ],
  tools: [
    { name: 'Visual Builder', path: '/visual-builder', icon: Layers },
    { name: 'AI Co-Pilot', path: '/ai-copilot', icon: Bot },
    { name: 'Templates', path: '/templates', icon: FileText },
    { name: 'History', path: '/history', icon: History },
    { name: 'Workflow', path: '/workflow', icon: WorkflowIcon },
    { name: 'Legal Packs', path: '/legal-packs', icon: Scale },
  ],
  settings: [
    { name: 'API Keys', path: '/api-keys', icon: Key },
    { name: 'Usage', path: '/usage', icon: BarChart3 },
    { name: 'Compliance', path: '/compliance-dashboard', icon: ShieldCheck },
  ],
  advanced: [
    { name: 'Benchmark', path: '/benchmark', icon: Target },
    { name: 'Optimization Lab', path: '/optimization-lab', icon: Beaker },
  ],
  connect: [
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Enterprise', path: '/enterprise', icon: Building2 },
    { name: 'Team', path: '/team', icon: UsersRound },
  ],
};

const mobileNavLinks = [
  { name: 'HOME', path: '/', icon: Home },
  { name: 'DASHBOARD', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI AGENTS', path: '/agents', icon: Zap },
  { name: 'ANALYTICS', path: '/analytics', icon: TrendingUp },
  { name: 'MARKETPLACE', path: '/marketplace', icon: Store },
  { name: 'INTEGRATIONS', path: '/integrations', icon: Plug },
  { name: 'SETTINGS', path: '/settings', icon: Settings },
];

export const Header = React.memo(({ user }: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
    setMobileMenuOpen(false);
  }, [navigate, toast]);

  const isActive = (path: string) => window.location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-zinc-800/50 shadow-lg shadow-black/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 group"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-100 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-white/20">
                <Sparkles className="h-5 w-5 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight bg-clip-text">PrompX</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`group relative px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 rounded-lg whitespace-nowrap ${
                  isActive(link.path)
                    ? 'text-white bg-zinc-900/50'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
                }`}
              >
                <span className="relative z-10">{link.name}</span>
                {isActive(link.path) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent" />
                )}
              </button>
            ))}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold tracking-wide text-zinc-400 transition-all duration-300 hover:text-white hover:bg-zinc-900/30 rounded-lg group whitespace-nowrap">
                  More
                  <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-black/95 backdrop-blur-xl border-zinc-800/50 shadow-2xl p-2">
                <DropdownMenuLabel className="text-zinc-500 text-xs font-semibold uppercase tracking-wider px-3 py-2">Account</DropdownMenuLabel>
                {moreItems.account.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="text-zinc-300 hover:text-white hover:bg-zinc-900/80 cursor-pointer rounded-md px-3 py-2.5 transition-all duration-200 group"
                    >
                      <Icon className="mr-3 h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                      <span className="font-medium">{item.name}</span>
                    </DropdownMenuItem>
                  );
                })}
                
                <DropdownMenuSeparator className="bg-zinc-800/50 my-2" />
                <DropdownMenuLabel className="text-zinc-500 text-xs font-semibold uppercase tracking-wider px-3 py-2">Tools</DropdownMenuLabel>
                {moreItems.tools.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="text-zinc-300 hover:text-white hover:bg-zinc-900/80 cursor-pointer rounded-md px-3 py-2.5 transition-all duration-200 group"
                    >
                      <Icon className="mr-3 h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                      <span className="font-medium">{item.name}</span>
                    </DropdownMenuItem>
                  );
                })}
                
                <DropdownMenuSeparator className="bg-zinc-800/50 my-2" />
                <DropdownMenuLabel className="text-zinc-500 text-xs font-semibold uppercase tracking-wider px-3 py-2">Settings</DropdownMenuLabel>
                {moreItems.settings.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="text-zinc-300 hover:text-white hover:bg-zinc-900/80 cursor-pointer rounded-md px-3 py-2.5 transition-all duration-200 group"
                    >
                      <Icon className="mr-3 h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                      <span className="font-medium">{item.name}</span>
                    </DropdownMenuItem>
                  );
                })}
                
                <DropdownMenuSeparator className="bg-zinc-800/50 my-2" />
                <DropdownMenuLabel className="text-zinc-500 text-xs font-semibold uppercase tracking-wider px-3 py-2">Advanced</DropdownMenuLabel>
                {moreItems.advanced.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="text-zinc-300 hover:text-white hover:bg-zinc-900/80 cursor-pointer rounded-md px-3 py-2.5 transition-all duration-200 group"
                    >
                      <Icon className="mr-3 h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                      <span className="font-medium">{item.name}</span>
                    </DropdownMenuItem>
                  );
                })}
                
                <DropdownMenuSeparator className="bg-zinc-800/50 my-2" />
                <DropdownMenuLabel className="text-zinc-500 text-xs font-semibold uppercase tracking-wider px-3 py-2">Connect</DropdownMenuLabel>
                {moreItems.connect.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="text-zinc-300 hover:text-white hover:bg-zinc-900/80 cursor-pointer rounded-md px-3 py-2.5 transition-all duration-200 group"
                    >
                      <Icon className="mr-3 h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                      <span className="font-medium">{item.name}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800">
                    <UserIcon className="h-4 w-4 text-zinc-300" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300 max-w-[150px] truncate">
                    {user.email}
                  </span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex text-zinc-300 hover:text-white hover:bg-zinc-900/50 transition-all duration-300 font-semibold"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                size="sm"
                className="hidden lg:flex bg-gradient-to-r from-white to-zinc-100 text-black hover:from-zinc-100 hover:to-zinc-200 font-semibold shadow-lg shadow-white/10 transition-all duration-300 hover:shadow-white/20"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white hover:bg-zinc-900/50 transition-all duration-300 rounded-lg"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-black/95 backdrop-blur-xl border-zinc-800/50 p-0">
                <div className="flex h-full flex-col">
                  
                  {/* Mobile Header */}
                  <div className="flex items-center gap-3 border-b border-zinc-800/50 px-6 py-5 bg-zinc-900/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-100 shadow-lg shadow-white/10">
                      <Sparkles className="h-5 w-5 text-black" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">PrompX</span>
                  </div>

                  {/* Mobile Navigation */}
                  <ScrollArea className="flex-1">
                    <nav className="space-y-2 p-4">
                      
                      {/* Main Navigation */}
                      <div className="mb-6">
                        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Main
                        </p>
                        <div className="space-y-1">
                          {mobileNavLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                              <button
                                key={link.path}
                                onClick={() => {
                                  navigate(link.path);
                                  setMobileMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 group ${
                                  isActive(link.path)
                                    ? 'bg-zinc-900/80 text-white shadow-lg shadow-zinc-900/50'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                                }`}
                              >
                                <Icon className={`h-5 w-5 transition-colors ${isActive(link.path) ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
                                <span>{link.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Account */}
                      <div className="mb-6">
                        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Account
                        </p>
                        <div className="space-y-1">
                          {moreItems.account.map((link) => {
                            const Icon = link.icon;
                            return (
                              <button
                                key={link.path}
                                onClick={() => {
                                  navigate(link.path);
                                  setMobileMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 group ${
                                  isActive(link.path)
                                    ? 'bg-zinc-900/80 text-white shadow-lg shadow-zinc-900/50'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                                }`}
                              >
                                <Icon className={`h-5 w-5 transition-colors ${isActive(link.path) ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
                                <span>{link.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tools */}
                      <div className="mb-6">
                        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Tools
                        </p>
                        <div className="space-y-1">
                          {moreItems.tools.map((link) => {
                            const Icon = link.icon;
                            return (
                              <button
                                key={link.path}
                                onClick={() => {
                                  navigate(link.path);
                                  setMobileMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 group ${
                                  isActive(link.path)
                                    ? 'bg-zinc-900/80 text-white shadow-lg shadow-zinc-900/50'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                                }`}
                              >
                                <Icon className={`h-5 w-5 transition-colors ${isActive(link.path) ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
                                <span>{link.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Settings */}
                      <div className="mb-6">
                        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Settings
                        </p>
                        <div className="space-y-1">
                          {moreItems.settings.map((link) => {
                            const Icon = link.icon;
                            return (
                              <button
                                key={link.path}
                                onClick={() => {
                                  navigate(link.path);
                                  setMobileMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 group ${
                                  isActive(link.path)
                                    ? 'bg-zinc-900/80 text-white shadow-lg shadow-zinc-900/50'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                                }`}
                              >
                                <Icon className={`h-5 w-5 transition-colors ${isActive(link.path) ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
                                <span>{link.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Advanced */}
                      <div className="mb-6">
                        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Advanced
                        </p>
                        <div className="space-y-1">
                          {moreItems.advanced.map((link) => {
                            const Icon = link.icon;
                            return (
                              <button
                                key={link.path}
                                onClick={() => {
                                  navigate(link.path);
                                  setMobileMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 group ${
                                  isActive(link.path)
                                    ? 'bg-zinc-900/80 text-white shadow-lg shadow-zinc-900/50'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                                }`}
                              >
                                <Icon className={`h-5 w-5 transition-colors ${isActive(link.path) ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
                                <span>{link.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Connect */}
                      <div className="mb-6">
                        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Connect
                        </p>
                        <div className="space-y-1">
                          {moreItems.connect.map((link) => {
                            const Icon = link.icon;
                            return (
                              <button
                                key={link.path}
                                onClick={() => {
                                  navigate(link.path);
                                  setMobileMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 group ${
                                  isActive(link.path)
                                    ? 'bg-zinc-900/80 text-white shadow-lg shadow-zinc-900/50'
                                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                                }`}
                              >
                                <Icon className={`h-5 w-5 transition-colors ${isActive(link.path) ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
                                <span>{link.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </nav>
                  </ScrollArea>

                  {/* Mobile User Section */}
                  {user ? (
                    <div className="border-t border-zinc-800/50 p-6 bg-zinc-900/20">
                      <div className="mb-4 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 shadow-lg">
                          <UserIcon className="h-5 w-5 text-zinc-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                          <p className="text-xs text-zinc-500 font-medium">Signed in</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full border-zinc-700/50 text-zinc-300 hover:bg-zinc-900/80 hover:text-white hover:border-zinc-600 transition-all duration-300 font-semibold shadow-lg"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="border-t border-zinc-800/50 p-6 bg-zinc-900/20">
                      <Button
                        onClick={() => {
                          navigate("/auth");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-white to-zinc-100 text-black hover:from-zinc-100 hover:to-zinc-200 font-semibold shadow-lg shadow-white/10 transition-all duration-300 hover:shadow-white/20"
                      >
                        Sign In
                      </Button>
                    </div>
                  )}

                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
