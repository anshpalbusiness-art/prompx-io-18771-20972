import React from 'react';
import { User } from '@supabase/supabase-js';
import { AppSidebar } from '@/components/AppSidebar';
import { Footer } from '@/components/Footer';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface LayoutProps {
  children: React.ReactNode;
  user?: User | null;
}

export const Layout = React.memo(({ children, user }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="h-screen w-full bg-background flex overflow-hidden">
        <AppSidebar user={user} />
        <SidebarInset className="flex flex-col flex-1 h-screen overflow-hidden">
          {/* Header with trigger */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-800/50 bg-black/95 backdrop-blur-xl px-4 z-10">
            <SidebarTrigger className="text-white hover:bg-zinc-900/50" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-400">PrompX</span>
            </div>
          </header>

          {/* Main Content with Footer - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
            <main className="min-h-full">
              {children}
            </main>
            <Footer />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
});

Layout.displayName = 'Layout';

export default Layout;