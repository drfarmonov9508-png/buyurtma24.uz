'use client';

import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import LanguageSelector from '@/components/ui/LanguageSelector';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title }: TopBarProps) {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6">
      {title && <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>}
      <div className="flex items-center gap-3 ml-auto">
        <button
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <LanguageSelector />
        {user && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100 dark:border-gray-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {getInitials(`${user.firstName} ${user.lastName}`)}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-primary-500 font-medium mt-0.5">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
