import React, { useState } from 'react';
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
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  user?: User | null;
}

export const Header = ({ user }: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
    };
    
    checkAdminStatus();
  }, [user]);

  const handleLogout = async () => {
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
  };

  // Primary nav items shown in desktop header
  const primaryNavItems = [
    { name: 'HOME', path: '/', icon: Home },
    { name: 'DASHBOARD', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI AGENTS', path: '/agents', icon: Zap },
    { name: 'ANALYTICS', path: '/analytics', icon: TrendingUp },
    { name: 'MARKETPLACE', path: '/marketplace', icon: Store },
    { name: 'INTEGRATIONS', path: '/integrations', icon: Plug },
    { name: 'SETTINGS', path: '/settings', icon: Settings },
  ];

  // Additional items in "More" dropdown with icons
  const moreNavItems = [
    // Prompt Engineer quick actions
    { name: 'Profile', path: '/profile', icon: UserIcon, category: 'Account' },
    { name: 'Pricing', path: '/pricing', icon: TrendingUp, category: 'Account' },
    { name: 'Visual Builder', path: '/visual-builder', icon: Layers, category: 'Tools' },
    { name: 'AI Co-Pilot', path: '/ai-copilot', icon: Bot, category: 'Tools' },
    { name: 'Templates', path: '/templates', icon: FileText, category: 'Tools' },
    { name: 'History', path: '/history', icon: History, category: 'Tools' },
    { name: 'Workflow', path: '/workflow', icon: WorkflowIcon, category: 'Tools' },
    { name: 'Legal Packs', path: '/legal-packs', icon: Scale, category: 'Tools' },
    { name: 'API Keys', path: '/api-keys', icon: Key, category: 'Settings' },
    { name: 'Usage', path: '/usage', icon: BarChart3, category: 'Settings' },
    { name: 'Compliance', path: '/compliance-dashboard', icon: ShieldCheck, category: 'Settings' },
    // Other sections
    { name: 'Benchmark', path: '/benchmark', icon: Target, category: 'Advanced' },
    { name: 'Optimization Lab', path: '/optimization-lab', icon: Beaker, category: 'Advanced' },
    { name: 'Community', path: '/community', icon: Users, category: 'Connect' },
    { name: 'Enterprise', path: '/enterprise', icon: Building2, category: 'Connect' },
    { name: 'Team', path: '/team', icon: UsersRound, category: 'Connect' },
  ];

  // All nav items for mobile menu with icons
  const allMobileNavItems = [
    ...primaryNavItems,
    ...moreNavItems,
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black backdrop-blur-xl border-b border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full">
      <div className="w-full">
        <div className="responsive-container">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-2 sm:gap-4 lg:gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-3 flex-shrink-0 group relative z-10"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-white to-zinc-100 rounded-xl flex items-center justify-center transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-6 shadow-[0_4px_20px_rgba(255,255,255,0.15)] group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)]">
                  <Sparkles className="w-5 h-5 text-black transition-transform duration-500 group-hover:rotate-12" strokeWidth={2.5} />
                </div>
                <span className="text-[1.4rem] font-extrabold text-white tracking-tight group-hover:text-zinc-100 transition-all duration-300 drop-shadow-sm">
                  PrompX
                </span>
              </button>
              
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden lg:flex h-10 px-5 bg-transparent border-white/[0.15] text-white hover:bg-white/[0.10] hover:text-white hover:border-white/25 rounded-xl font-bold transition-all duration-300 hover:shadow-[0_4px_16px_rgba(255,255,255,0.12)] hover:scale-105 active:scale-95"
                >
                  <LogOut className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                  Sign Out
                </Button>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2 xl:gap-3 flex-1 justify-center">
              {primaryNavItems.map((link) => {
                const isActive = window.location.pathname === link.path;
                return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`relative px-3 xl:px-4 py-2.5 text-[0.75rem] xl:text-[0.8125rem] font-bold rounded-xl transition-all duration-300 tracking-tight whitespace-nowrap ${
                    isActive
                      ? 'bg-white/[0.15] text-white shadow-[0_4px_16px_rgba(255,255,255,0.12)] scale-[1.02]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:scale-105 active:scale-100'
                  }`}
                >
                    {link.name}
                    {isActive && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full shadow-[0_2px_8px_rgba(255,255,255,0.5)]" />
                    )}
                  </button>
                );
              })}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative px-3 xl:px-4 py-2.5 text-[0.75rem] xl:text-[0.8125rem] font-bold rounded-xl transition-all duration-300 tracking-tight whitespace-nowrap text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:scale-105 active:scale-100 flex items-center gap-1.5 group">
                    MORE
                    <ChevronDown className="w-4 h-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[320px] max-h-[600px] overflow-y-auto bg-black border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.95)] z-[100]"
                  sideOffset={12}
                >
                  {['Account', 'Tools', 'Settings', 'Advanced', 'Connect'].map((category, idx) => {
                    const categoryItems = moreNavItems.filter(item => item.category === category);
                    if (categoryItems.length === 0) return null;
                    
                    return (
                      <div key={category} className={idx > 0 ? "border-t border-white/[0.08] pt-2" : "pt-1"}>
                        <div className="px-4 pt-3 pb-2 text-[0.6875rem] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-white/40" />
                          {category}
                        </div>
                        <div className="px-2 pb-2 space-y-0.5">
                          {categoryItems.map((link) => {
                            const Icon = link.icon;
                            return (
                              <DropdownMenuItem
                                key={link.path}
                                onSelect={() => {
                                  navigate(link.path);
                                }}
                                className="cursor-pointer font-medium text-sm py-3 px-3 rounded-xl transition-all duration-200 group"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/[0.12] to-white/[0.06] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:from-white/[0.18] group-hover:to-white/[0.10] group-hover:scale-110 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                                    <Icon className="w-[1.125rem] h-[1.125rem] text-white" strokeWidth={2.5} />
                                  </div>
                                  <span className="text-white font-semibold tracking-tight">{link.name}</span>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* User Section */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              {user ? (
                <div className="text-sm text-zinc-300 font-semibold px-4 py-2.5 bg-white/[0.08] rounded-xl border border-white/[0.10] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.10] hover:border-white/[0.15] hover:shadow-[0_4px_12px_rgba(255,255,255,0.08)] cursor-default max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {user.email}
                </div>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  size="sm"
                  className="bg-gradient-to-r from-white to-zinc-100 text-black hover:from-zinc-50 hover:to-white h-11 px-6 font-bold shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.35)] transition-all duration-300 rounded-xl hover:scale-105 active:scale-95"
                >
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-white hover:bg-white/[0.10] rounded-xl h-11 w-11 p-0 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_4px_12px_rgba(255,255,255,0.08)]"
                >
                  <Menu className="w-5 h-5 transition-transform duration-300" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[90vw] max-w-[380px] bg-black/100 border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col z-[100]">
                <div className="flex flex-col h-full">
                  {/* Mobile Logo */}
                  <div className="flex items-center gap-3 px-2 mb-6 mt-8 flex-shrink-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-white to-zinc-100 rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(255,255,255,0.15)]">
                      <Sparkles className="w-5 h-5 text-black" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-extrabold text-white tracking-tight drop-shadow-sm">
                      PrompX
                    </span>
                  </div>

                  {/* Scrollable Navigation */}
                  <ScrollArea className="flex-1 px-1">
                    <nav className="flex flex-col gap-2 pb-4">
                    {['Main', 'Account', 'Tools', 'Settings', 'Advanced', 'Connect'].map((category) => {
                      const categoryItems = category === 'Main' 
                        ? primaryNavItems
                        : moreNavItems.filter(item => item.category === category);
                      
                      if (categoryItems.length === 0) return null;
                      
                      return (
                        <div key={category} className="mb-2">
                          <div className="px-3 py-2 text-[0.6875rem] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-white/40" />
                            {category}
                          </div>
                          <div className="space-y-1">
                            {categoryItems.map((link) => {
                              const isActive = window.location.pathname === link.path;
                              const Icon = link.icon;
                              return (
                                <button
                                  key={link.path}
                                  onClick={() => {
                                    navigate(link.path);
                                    setMobileMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-3 text-sm font-semibold tracking-tight rounded-xl transition-all duration-300 flex items-center gap-3 ${
                                    isActive
                                      ? 'bg-white/[0.12] text-white shadow-[0_4px_12px_rgba(255,255,255,0.08)]'
                                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] active:scale-[0.98]'
                                  }`}
                                >
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                    isActive ? 'bg-white/[0.15]' : 'bg-white/[0.08]'
                                  }`}>
                                    <Icon className="w-4 h-4" strokeWidth={2.5} />
                                  </div>
                                  <span>{link.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    </nav>
                  </ScrollArea>

                  {/* Fixed User Section */}
                  {user && (
                    <div className="pt-5 border-t border-white/[0.08] space-y-4 px-1 flex-shrink-0 mt-4">
                      <div className="text-sm text-zinc-300 font-semibold px-4 py-2.5 bg-white/[0.08] rounded-xl border border-white/[0.10] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.10] hover:border-white/[0.15] hover:shadow-[0_4px_12px_rgba(255,255,255,0.08)] cursor-default overflow-hidden text-ellipsis whitespace-nowrap">
                        {user.email}
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="w-full h-11 bg-transparent border-white/[0.12] text-white hover:bg-white/[0.08] hover:border-white/20 rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_4px_12px_rgba(255,255,255,0.08)] active:scale-[0.98]"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
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
};

export default Header;
