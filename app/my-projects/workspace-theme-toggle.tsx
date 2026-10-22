'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from './workspace.module.css';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'skills-connect-workspace-theme';

export function WorkspaceThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial: Theme = saved === 'light' || saved === 'dark'
      ? saved
      : window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';

    setTheme(initial);
    const shell = document.querySelector<HTMLElement>('[data-workspace-shell]');
    shell?.setAttribute('data-theme', initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    const shell = document.querySelector<HTMLElement>('[data-workspace-shell]');
    shell?.setAttribute('data-theme', next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
