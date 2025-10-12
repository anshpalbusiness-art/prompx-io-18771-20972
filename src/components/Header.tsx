import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, LogOut, Menu, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
    { name: 'HOME', path: '/' },
    { name: 'DASHBOARD', path: '/dashboard' },
    { name: 'AI AGENTS', path: '/agents' },
    { name: 'ANALYTICS', path: '/analytics' },
    { name: 'MARKETPLACE', path: '/marketplace' },
  ];

  // Additional items in "More" dropdown
  const moreNavItems = [
    { name: 'BENCHMARK', path: '/benchmark' },
    { name: 'OPTIMIZATION LAB', path: '/optimization-lab' },
    { name: 'COMMUNITY', path: '/community' },
    { name: 'ENTERPRISE', path: '/enterprise' },
    { name: 'INTEGRATIONS', path: '/integrations' },
    { name: 'TEAM', path: '/team' },
    { name: 'SETTINGS', path: '/settings' },
  ];

  // All nav items for mobile menu
  const allNavItems = [
    { name: 'HOME', path: '/' },
    { name: 'DASHBOARD', path: '/dashboard' },
    { name: 'BENCHMARK', path: '/benchmark' },
    { name: 'AI AGENTS', path: '/agents' },
    { name: 'OPTIMIZATION LAB', path: '/optimization-lab' },
    { name: 'ANALYTICS', path: '/analytics' },
    { name: 'COMMUNITY', path: '/community' },
    { name: 'ENTERPRISE', path: '/enterprise' },
    { name: 'INTEGRATIONS', path: '/integrations' },
    { name: 'TEAM', path: '/team' },
    { name: 'MARKETPLACE', path: '/marketplace' },
    { name: 'SETTINGS', path: '/settings' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full">
      <div className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1600px]">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-8">
            {/* Logo */}
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

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center px-4">
              {primaryNavItems.map((link) => {
                const isActive = window.location.pathname === link.path;
                return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`relative px-4 py-2.5 text-[0.875rem] font-semibold rounded-xl transition-all duration-300 tracking-wide whitespace-nowrap ${
                    isActive
                      ? 'bg-white/[0.12] text-white shadow-[0_4px_16px_rgba(255,255,255,0.12)] scale-[1.02]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:scale-105 active:scale-100'
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
                  <button className="relative px-4 py-2.5 text-[0.875rem] font-semibold rounded-xl transition-all duration-300 tracking-wide whitespace-nowrap text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:scale-105 active:scale-100 flex items-center gap-1">
                    MORE
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[220px] p-2"
                >
                  {moreNavItems.map((link) => (
                    <DropdownMenuItem
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className="cursor-pointer font-semibold text-sm py-2.5 px-3 rounded-lg"
                    >
                      {link.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* User Section */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              {user ? (
                <>
                  <div className="text-sm text-zinc-300 font-medium px-4 py-2.5 bg-white/[0.06] rounded-xl border border-white/[0.08] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.12] hover:shadow-[0_4px_12px_rgba(255,255,255,0.08)] cursor-default max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {user.email}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="h-10 px-5 bg-transparent border-white/[0.12] text-zinc-300 hover:bg-white/[0.08] hover:text-white hover:border-white/20 rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_4px_16px_rgba(255,255,255,0.12)] hover:scale-105 active:scale-95"
                  >
                    <LogOut className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  size="sm"
                  className="bg-gradient-to-r from-white to-zinc-100 text-black hover:from-zinc-50 hover:to-white h-10 px-6 font-bold shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.35)] transition-all duration-300 rounded-xl hover:scale-105 active:scale-95"
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
                  className="lg:hidden text-white hover:bg-white/[0.08] rounded-xl h-10 w-10 p-0 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_4px_12px_rgba(255,255,255,0.08)]"
                >
                  <Menu className="w-5 h-5 transition-transform duration-300" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] bg-black border-l border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col gap-6 mt-8">
                  {/* Mobile Logo */}
                  <div className="flex items-center gap-3 px-2 mb-2">
                    <div className="w-11 h-11 bg-gradient-to-br from-white to-zinc-100 rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(255,255,255,0.15)]">
                      <Sparkles className="w-5 h-5 text-black" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-extrabold text-white tracking-tight drop-shadow-sm">
                      PrompX
                    </span>
                  </div>

                  <nav className="flex flex-col gap-1.5 px-1">
                    {allNavItems.map((link) => {
                      const isActive = window.location.pathname === link.path;
                      return (
                        <button
                          key={link.name}
                          onClick={() => {
                            navigate(link.path);
                            setMobileMenuOpen(false);
                          }}
                          className={`text-left px-5 py-3.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                            isActive
                              ? 'bg-white/[0.12] text-white shadow-[0_4px_12px_rgba(255,255,255,0.08)]'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] active:scale-[0.98]'
                          }`}
                        >
                          {link.name}
                        </button>
                      );
                    })}
                  </nav>

                  {user && (
                    <div className="pt-5 border-t border-white/[0.08] space-y-4 px-1">
                      <div className="px-1">
                        <div className="text-sm text-zinc-300 font-medium px-4 py-3 bg-white/[0.06] rounded-xl border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                          {user.email}
                        </div>
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
