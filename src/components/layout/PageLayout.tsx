import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface PageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function PageLayout({ title, subtitle, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} subtitle={subtitle} />
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
