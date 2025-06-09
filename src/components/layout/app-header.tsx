'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Moon, Sun, LogOut, LogIn } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

export function AppHeader() {
  // The following theme toggle is a common addition. If next-themes is not part of the scaffold,
  // this part can be simplified or removed. For now, I'll include it as good practice.
  // If 'next-themes' is not installed, run: npm install next-themes
  // And wrap AppLayout with <ThemeProvider attribute="class" defaultTheme="system" enableSystem> in RootLayout.
  // For this exercise, I'll make a simplified version that doesn't rely on next-themes immediately to avoid new deps.
  // const { theme, setTheme } = useTheme();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // Avoid hydration mismatch

  const toggleTheme = () => 
    setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      router.push('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center">
        <SidebarTrigger className="mr-2 md:hidden" />
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        ) : (
          <Button variant="outline" onClick={handleLogin}>
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
