'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
  }
>(({ className, side = 'left', variant = 'sidebar', collapsible = 'offcanvas', ...props }, ref) => {
  const baseClasses = 'sticky top-0 z-40 flex h-screen flex-col transition-all duration-300 ease-in-out overflow-hidden shrink-0';
  const variantClasses = {
    sidebar: 'w-64 bg-white/70 backdrop-blur-2xl dark:bg-black/40 border-r border-white/20 dark:border-white/5 shadow-apple-lg',
    floating: 'w-64 bg-white/80 backdrop-blur-2xl dark:bg-black/50 rounded-2xl shadow-apple-xl border border-white/30 dark:border-white/10',
    inset: 'bg-transparent',
  };
  const sideClasses = side === 'left' ? 'left-0' : 'right-0';

  return (
    <div
      ref={ref}
      className={cn(baseClasses, variantClasses[variant], sideClasses, className)}
      {...props}
    />
  );
});
Sidebar.displayName = 'Sidebar';

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-1 flex-col overflow-y-auto', className)} {...props} />
  )
);
SidebarContent.displayName = 'SidebarContent';

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2 p-4', className)} {...props} />
  )
);
SidebarHeader.displayName = 'SidebarHeader';

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2 p-4', className)} {...props} />
  )
);
SidebarFooter.displayName = 'SidebarFooter';

const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-1 flex-col', className)} {...props} />
  )
);
SidebarInset.displayName = 'SidebarInset';

const SidebarInput = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<'input'>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500', className)}
      {...props}
    />
  )
);
SidebarInput.displayName = 'SidebarInput';

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentPropsWithoutRef<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
  )
);
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'> & { asChild?: boolean; isActive?: boolean; variant?: 'default' | 'outline' }>(
  ({ asChild = false, isActive = false, variant = 'default', className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' &&
            'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
          variant === 'outline' &&
            'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
          isActive &&
            'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('', className)} {...props} />
  )
);
SidebarMenuItem.displayName = 'SidebarMenuItem';

const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentPropsWithoutRef<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-col gap-1 pl-4', className)} {...props} />
  )
);
SidebarMenuSub.displayName = 'SidebarMenuSub';

const SidebarMenuSubButton = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'> & { asChild?: boolean }>(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';

const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('', className)} {...props} />
  )
);
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem';

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('relative flex flex-col gap-2 p-4', className)} {...props} />
  )
);
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupLabel = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<'p'>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider', className)} {...props} />
  )
);
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
  )
);
SidebarGroupContent.displayName = 'SidebarGroupContent';

const SidebarGroupAction = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2', className)} {...props} />
  )
);
SidebarGroupAction.displayName = 'SidebarGroupAction';

const SidebarSeparator = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mx-2 h-px bg-slate-200 dark:bg-slate-700', className)} {...props} />
  )
);
SidebarSeparator.displayName = 'SidebarSeparator';

export {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarInset,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarGroupAction,
  SidebarSeparator,
};