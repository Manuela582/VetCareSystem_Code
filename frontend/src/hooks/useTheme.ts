import { useEffect, useState } from 'react';

const KEY = 'vetcare-theme';

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem(KEY) === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(KEY, dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
