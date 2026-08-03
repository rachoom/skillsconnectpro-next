'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import styles from './palette.module.css';

type Theme = 'light' | 'dark';

interface ThemeShellProps {
  children: ReactNode;
  fontClassName: string;
}

const STORAGE_KEY = 'skills-connect-provider-theme';

export default function ThemeShell({ children, fontClassName }: ThemeShellProps) {
  const [preference, setPreference] = useState<Theme | null>(null);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const saved = window.localStorage.getItem(STORAGE_KEY);

    setSystemDark(media.matches);
    if (saved === 'light' || saved === 'dark') setPreference(saved);

    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const effectiveTheme: Theme = preference ?? (systemDark ? 'dark' : 'light');

  const toggleTheme = () => {
    const nextTheme: Theme = effectiveTheme === 'dark' ? 'light' : 'dark';
    setPreference(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <div
      className={`${styles.shell} ${fontClassName} ${
        preference === 'dark' ? styles.dark : preference === 'light' ? styles.light : ''
      }`}
    >
      <div className={styles.topbar}>
        <span className={styles.topbarTitle}>Job opportunity</span>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {effectiveTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          <span>{effectiveTheme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
      {children}
    </div>
  );
}
