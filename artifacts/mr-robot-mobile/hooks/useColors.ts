import { useContext } from 'react';

import { AppContext } from '@/contexts/AppContext';

const DARK = {
  text: '#e0e0e0',
  tint: '#00D4FF',
  background: '#000000',
  foreground: '#e0e0e0',
  card: '#0a0a0a',
  cardForeground: '#e0e0e0',
  primary: '#00D4FF',
  primaryForeground: '#000000',
  secondary: '#111111',
  secondaryForeground: '#a0a0a0',
  muted: '#111111',
  mutedForeground: '#525252',
  accent: '#001a1f',
  accentForeground: '#00D4FF',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  border: '#1a1a1a',
  input: '#1a1a1a',
};

const HACKER = {
  ...DARK,
  primary: '#00FF41',
  tint: '#00FF41',
  primaryForeground: '#000000',
  accent: '#001a00',
  accentForeground: '#00FF41',
  background: '#000000',
  card: '#010d01',
  border: '#0a1a0a',
  input: '#0a1a0a',
  secondary: '#0a1a0a',
  muted: '#0a1a0a',
};

export function useColors() {
  const ctx = useContext(AppContext);
  const amoledBlack = ctx?.settings?.amoledBlack ?? true;
  const hackerMode = ctx?.settings?.hackerMode ?? false;

  if (hackerMode) {
    return { ...HACKER, radius: 8 };
  }

  return {
    ...DARK,
    background: amoledBlack ? '#000000' : '#0d0d0d',
    card: amoledBlack ? '#0a0a0a' : '#111111',
    radius: 8,
  };
}
