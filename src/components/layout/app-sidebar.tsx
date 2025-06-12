'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Bus, TrainFront, Wind, LogOut, Info, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bus', label: 'Bus Tracking', icon: Bus },
  { href: '/train', label: 'Train Tracking', icon: TrainFront },
  { href: '/metra', label: 'Metra Rail', icon: Ticket },
  { href: '/about', label: 'About', icon: Info },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <Wind className="h-8 w-8 text-sidebar-primary" />
          <span className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            ChiCommute
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/') || (pathname === '/' && item.href === '/dashboard')}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  className={cn(
                    (pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/') || (pathname === '/' && item.href === '/dashboard'))
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
                      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    'justify-start'
                  )}
                >
                  <a>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-0">
        {/* Placeholder for potential future elements like user profile or logout */}
        {/* <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center">
          <LogOut className="h-5 w-5" />
          <span className="group-data-[collapsible=icon]:hidden ml-2">Logout</span>
        </Button> */}
      </SidebarFooter>
    </Sidebar>
  );
}
