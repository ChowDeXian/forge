import { Platform } from 'react-native';

export const THEMES = {
  dark: {
    bg: '#0D0D0D', surface: '#1A1A1A', surface2: '#222222', surface3: '#2A2A2A',
    accent: '#C8F135', onAccent: '#0D0D0D', accentDim: 'rgba(200,241,53,0.14)',
    muted: '#6B6B6B', text: '#F5F5F5', line: 'rgba(255,255,255,0.08)', danger: '#ff6b6b',
  },
  light: {
    bg: '#F2F2F0', surface: '#FFFFFF', surface2: '#F6F6F4', surface3: '#ECECEA',
    accent: '#5C7A0C', onAccent: '#FFFFFF', accentDim: 'rgba(92,122,12,0.12)',
    muted: '#5C5C5C', text: '#141414', line: 'rgba(0,0,0,0.08)', danger: '#c0392b',
  },
};

export const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
