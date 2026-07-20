'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Trophy, ClipboardList, BarChart2, Settings, LogOut, Menu, ChevronDown, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigationGroups = [
  {
    label: 'Asosiy',
    items: [
      { name: 'Bosh sahifa', href: '/admin', icon: LayoutDashboard },
      { name: 'Statistika', href: '/admin', icon: BarChart2 },
    ]
  },
  {
    label: 'Boshqaruv',
    items: [
      { name: 'Olimpiadalar', href: '/admin/olympiads', icon: Trophy },
      { name: 'Arizalar', href: '/admin/registrations', icon: ClipboardList },
      { name: 'O\'quvchilar', href: '/admin/users', icon: Users },
      { name: 'Binolar', href: '/admin/locations', icon: GraduationCap },
    ]
  },
  {
    label: 'Tizim',
    items: [
      { name: 'Tizim sozlamalari', href: '/dashboard/settings', icon: Settings },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if ((!user || user.role !== 'ADMIN') && pathname !== '/admin') {
      router.push('/admin');
    }
  }, [user, pathname, router, mounted]);

  if (!mounted) return null;

  // Agar user admin bo'lmasa:
  if (!user || user.role !== 'ADMIN') {
    // faqat /admin sahifasida children ko'rsatiladi (login form)
    // boshqa sahifalarda null qaytariladi (redirect kutish)
    if (pathname === '/admin') {
      return <>{children}</>;
    }
    return null;
  }

  const filteredNavGroups = navigationGroups;

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-slate-50 dark:bg-dark-bg">
      <Sidebar className={cn("hidden lg:flex transition-all duration-500 overflow-hidden glass-panel border-r-0 rounded-r-3xl m-2 my-4 shadow-2xl", sidebarOpen ? "w-64" : "w-[72px]")}>
        <SidebarHeader>
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", sidebarOpen ? "max-w-[200px] opacity-100 ml-3" : "max-w-0 opacity-0 ml-0")}>
              <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white">Admin CRM</h1>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Boshqaruv paneli</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="space-y-6 pt-4 pb-4 overflow-y-auto">
          {filteredNavGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className={cn("px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2", sidebarOpen ? "block" : "hidden")}>
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin' && item.href !== '/dashboard')}
                      >
                        <Link href={item.href} className="flex items-center w-full" title={!sidebarOpen ? item.name : undefined}>
                          <item.icon className={cn("h-5 w-5 shrink-0", pathname === item.href ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400")} />
                          <span className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap font-medium", sidebarOpen ? "max-w-[200px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0")}>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? ''}
              </div>
              <div className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", sidebarOpen ? "flex-1 max-w-[200px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0")}>
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.phoneNumber}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Chiqish" className={cn("shrink-0 transition-all duration-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400", sidebarOpen ? "opacity-100 max-w-[40px] ml-2" : "opacity-0 max-w-0 hidden")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="h-16 glass-panel sticky top-0 z-40 shadow-sm border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden lg:flex hover:bg-indigo-50 dark:hover:bg-indigo-900/20" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Yon panelni ochish/yopish">
                <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </Button>
            
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menyuni ochish">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <BarChart2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-display font-bold text-lg">Admin CRM</h1>
                  </div>
                </div>
                <div className="p-4 space-y-6">
                  {filteredNavGroups.map((group) => (
                    <div key={group.label}>
                      <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin' && item.href !== '/dashboard')}>
                              <Link href={item.href} onClick={() => setMobileMenuOpen(false)} className="py-3">
                                <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-indigo-600" : "text-slate-500")} />
                                <span className="font-medium">{item.name}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                      {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.fullName ?? 'Administrator'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                        {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
                      </div>
                      <div>
                        <p className="font-medium">{user?.fullName ?? 'Administrator'}</p>
                        <p className="text-xs text-slate-500 capitalize">Boshqaruvchi</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
