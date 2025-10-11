import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, LogOut, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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

  const navItems = [
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl shadow-black/20 w-full">
      <div className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1600px]">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-8">
            {/* Logo */}
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 flex-shrink-0 group relative"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-white to-zinc-100 rounded-xl flex items-center justify-center transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-6 shadow-lg group-hover:shadow-2xl group-hover:shadow-white/30">
                <Sparkles className="w-5 h-5 text-black transition-transform duration-500 group-hover:rotate-12" strokeWidth={2.5} />
              </div>
              <span className="text-[1.35rem] font-extrabold text-white tracking-tight group-hover:text-zinc-100 transition-all duration-300">
                PrompX
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1.5 flex-1 justify-center">
              {navItems.map((link) => {
                const isActive = window.location.pathname === link.path;
                return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`relative px-3.5 py-2.5 text-[0.8125rem] font-semibold rounded-xl transition-all duration-300 tracking-wide whitespace-nowrap ${
                    isActive
                      ? 'bg-white/[0.12] text-white shadow-lg shadow-white/10'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:scale-105'
                  }`}
                >
                    {link.name}
                    {isActive && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full shadow-sm shadow-white/50" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
              {user ? (
                <>
                  <div className="text-sm text-zinc-300 font-medium px-4 py-2.5 bg-white/[0.06] rounded-xl border border-white/[0.08] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.12]">
                    {user.email}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="h-10 px-5 bg-transparent border-white/[0.12] text-zinc-300 hover:bg-white/[0.08] hover:text-white hover:border-white/20 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:scale-105 active:scale-95"
                  >
                    <LogOut className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  size="sm"
                  className="bg-gradient-to-r from-white to-zinc-100 text-black hover:from-zinc-50 hover:to-white h-10 px-7 font-bold shadow-lg hover:shadow-2xl hover:shadow-white/30 transition-all duration-300 rounded-xl hover:scale-105 active:scale-95"
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
                  className="lg:hidden text-white hover:bg-white/[0.08] rounded-xl h-10 w-10 p-0 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Menu className="w-5 h-5 transition-transform duration-300" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] bg-black border-white/[0.08]">
                <div className="flex flex-col gap-6 mt-10">
                  {/* Mobile Logo */}
                  <div className="flex items-center gap-3 px-2 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-white to-zinc-100 rounded-xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-black" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-extrabold text-white tracking-tight">
                      PrompX
                    </span>
                  </div>

                  <nav className="flex flex-col gap-1.5">
                    {navItems.map((link) => {
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
                              ? 'bg-white/[0.12] text-white shadow-lg shadow-white/5'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          {link.name}
                        </button>
                      );
                    })}
                  </nav>

                  {user && (
                    <div className="pt-5 border-t border-white/[0.08] space-y-4">
                      <div className="px-2">
                        <div className="text-sm text-zinc-300 font-medium px-4 py-2.5 bg-white/[0.06] rounded-xl border border-white/[0.08]">
                          {user.email}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="w-full h-11 bg-transparent border-white/[0.12] text-white hover:bg-white/[0.08] hover:border-white/20 rounded-xl font-semibold transition-all duration-300"
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
