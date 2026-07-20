'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Trophy, BarChart2, Settings, LogOut, Bell, User, Menu, ChevronDown, Users, ClipboardList, GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Statistika', href: '/admin', icon: BarChart2 },
  { name: 'Olimpiadalar', href: '/admin/olympiads', icon: Trophy },
  { name: 'Arizalar', href: '/admin/registrations', icon: ClipboardList },
  { name: 'O\'quvchilar', href: '/admin/users', icon: Users },
  { name: 'Binolar', href: '/admin/locations', icon: GraduationCap },
  { name: 'Sozlamalar', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, mounted, router]);

  if (!mounted) return null;
  if (!user || user.role !== 'ADMIN') return null;

  const filteredNav = navigation;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-dark-bg">
      {/* Apple-style Glass Sidebar */}
      <Sidebar className={cn(
        "hidden lg:flex transition-all duration-500 overflow-hidden rounded-2xl m-2 my-3",
        "bg-white/80 dark:bg-black/50 backdrop-blur-3xl",
        "border border-white/40 dark:border-white/[0.06]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15)]",
        sidebarOpen ? "w-64" : "w-[72px]"
      )}>
        <SidebarHeader>
          <div className="flex items-center gap-3 px-4 py-5">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" strokeWidth="1.5"/>
                <line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="21"/>
                <line x1="3" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21" y2="12"/>
              </svg>
            </div>
            <div className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", sidebarOpen ? "max-w-[200px] opacity-100 ml-3" : "max-w-0 opacity-0 ml-0")}>
              <h1 className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">Olimpiy</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {filteredNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')}
                >
                  <Link href={item.href} className="flex items-center w-full" title={!sidebarOpen ? item.name : undefined}>
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", sidebarOpen ? "max-w-[200px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0")}>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className="p-4 border-t border-white/30 dark:border-white/[0.06]">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-white/50 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/5 flex items-center justify-center shadow-apple-tight">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? ''}
              </div>
              <div className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", sidebarOpen ? "flex-1 max-w-[200px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0")}>
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.phoneNumber}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Chiqish" className={cn("shrink-0 transition-all duration-300 hover:bg-red-500/10 hover:text-red-600", sidebarOpen ? "opacity-100 max-w-[40px] ml-2" : "opacity-0 max-w-0 hidden")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Apple-style Glass Header */}
        <header className="h-16 sticky top-0 z-40 bg-white/80 dark:bg-black/50 backdrop-blur-3xl border-b border-white/30 dark:border-white/[0.06] shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden lg:flex bg-white/40 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-apple-tight" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Yon panelni ochish/yopish">
                <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </Button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden bg-white/40 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-apple-tight" aria-label="Menyuni ochish">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-white/90 dark:bg-black/70 backdrop-blur-3xl border-r border-white/30 dark:border-white/[0.06]">
                  <SidebarContent>
                    <SidebarMenu>
                      {filteredNav.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={pathname === item.href}>
                            <Link href={item.href} onClick={() => setMobileMenuOpen(false)}>
                              <item.icon className="h-5 w-5" />
                              <span>{item.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarContent>
                </SheetContent>
              </Sheet>
            </div>

            {/* Breadcrumb area - could be dynamic */}
            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative bg-white/40 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-apple-tight" aria-label="Bildirishnomalar">
                  <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-[0_2px_6px_rgba(239,68,68,0.4)]">3</span>
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 pr-3 bg-white/40 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all rounded-xl shadow-apple-tight">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
                      {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-slate-900 dark:text-white">
                      {user?.fullName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/90 dark:bg-black/70 backdrop-blur-3xl border border-white/30 dark:border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                  <DropdownMenuLabel className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{user?.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role?.toLowerCase()}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/30 dark:bg-white/[0.06]" />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 focus:text-slate-900 dark:focus:text-white">
                      <User className="h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 focus:text-slate-900 dark:focus:text-white">
                      <Settings className="h-4 w-4" />
                      Sozlamalar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/30 dark:bg-white/[0.06]" />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}