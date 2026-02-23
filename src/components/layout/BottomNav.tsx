import { Home, FileText, DollarSign, BookOpen, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: Home, label: 'HOME' },
  { to: '/registro', icon: FileText, label: 'REGISTRO' },
  { to: '/finanze', icon: DollarSign, label: 'FINANZE' },
  { to: '/leggi', icon: BookOpen, label: 'LEGGI' },
  { to: '/dati', icon: Settings, label: 'DATI' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item flex-1 py-2 ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
