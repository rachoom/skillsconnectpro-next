'use client';

import { Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'scp-theme';

function readTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.scpTheme === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.scpTheme = theme;
  document.documentElement.style.colorScheme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Theme still applies for the current page when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent('scp-theme-change', { detail: theme }));
}

export const ThemeModeToggle = () => {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isPlans = pathname === '/plans' || pathname === '/provider-plans' || pathname.startsWith('/provider-plans/');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const initialSyncFrame = window.requestAnimationFrame(() => {
      setTheme(readTheme());
    });

    const syncTheme = (event: Event) => {
      const nextTheme = (event as CustomEvent<ThemeMode>).detail;
      setTheme(nextTheme === 'light' ? 'light' : 'dark');
    };

    window.addEventListener('scp-theme-change', syncTheme);
    return () => {
      window.cancelAnimationFrame(initialSyncFrame);
      window.removeEventListener('scp-theme-change', syncTheme);
    };
  }, []);

  const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
  const label = nextTheme === 'light' ? 'Use light theme' : 'Use dark theme';

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
      className={`fixed z-[120] flex min-h-11 min-w-11 items-center justify-center gap-2 border text-white shadow-2xl shadow-black/35 backdrop-blur-xl transition active:scale-95 ${
        isPlans
          ? 'rounded-full border-[#ffd75f]/35 bg-[#0b120c]/92 p-2.5 hover:border-[#ffd75f]/70'
          : isHome
            ? 'rounded-full border-[#f5c518]/45 bg-[#120b07]/80 px-3 sm:px-4'
            : 'rounded-2xl border-white/20 bg-black/70 px-3 sm:px-4'
      }`}
      style={isPlans ? {
        right: 'max(0.85rem, env(safe-area-inset-right))',
        bottom: 'max(0.85rem, env(safe-area-inset-bottom))',
      } : {
        left: 'max(0.8rem, env(safe-area-inset-left))',
        bottom: 'max(0.8rem, env(safe-area-inset-bottom))',
      }}
      data-scp-theme-location={isPlans ? 'plans-corner' : isHome ? 'hero' : 'floating'}
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      {nextTheme === 'light' ? <Sun size={19} /> : <Moon size={19} />}
      {!isPlans && <span className="hidden text-[11px] font-black uppercase tracking-wider lg:inline">
        {nextTheme === 'light' ? 'Light mode' : 'Dark mode'}
      </span>}
    </button>
  );
};
