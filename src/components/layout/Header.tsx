import { useState } from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { Home as HomeIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HeaderProps {
  title: string;
  subtitle: string;
  notificationCount?: number;
}

export function Header({ title, subtitle, notificationCount = 0 }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <HomeIcon className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {notificationCount > 0 ? (
          <button className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-urgent text-urgent-foreground text-xs rounded-full flex items-center justify-center font-semibold">
              {notificationCount}
            </span>
          </button>
        ) : (
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Bell className="w-5 h-5 text-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <p className="text-sm text-muted-foreground text-center">Nessuna notifica</p>
            </PopoverContent>
          </Popover>
        )}
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-foreground" />
          )}
        </button>
      </div>
    </header>
  );
}