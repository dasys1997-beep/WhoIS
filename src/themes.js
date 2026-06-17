// Чотири теми застосунку. Кожна тема повністю міняє фон, картки, текст і акценти —
// не тільки колір елементів, а весь характер інтерфейсу.

export const THEMES = {
  parchment: {
    label: 'Пергамент',
    swatch: '#C8A97E',
    vars: {
      '--bg': '#F2EAD8',
      '--header': '#E8DCC8',
      '--card': '#FAF5EC',
      '--text': '#2C1A08',
      '--muted': '#9A7A50',
      '--border': '#D4C4A0',
      '--accent': '#8B5E2A',
      '--accent-text': '#FAF5EC',
      '--chip': '#E0D0B0',
      '--chip-text': '#5C3A18',
      '--input': '#EEE4CC',
      '--modal': '#F5EDD8',
      '--danger': '#A32D2D',
      '--success': '#3B6D11',
    },
  },
  midnight: {
    label: 'Ніч',
    swatch: '#2A2D3E',
    vars: {
      '--bg': '#12141E',
      '--header': '#1A1D2E',
      '--card': '#20243A',
      '--text': '#D8DCF0',
      '--muted': '#6870A0',
      '--border': '#2E3450',
      '--accent': '#7B8FE8',
      '--accent-text': '#0E1020',
      '--chip': '#252A42',
      '--chip-text': '#8890C0',
      '--input': '#1C2035',
      '--modal': '#1E2238',
      '--danger': '#E8888C',
      '--success': '#7DD89A',
    },
  },
  forest: {
    label: 'Ліс',
    swatch: '#1E3A2F',
    vars: {
      '--bg': '#0E1F14',
      '--header': '#142A1A',
      '--card': '#1A3422',
      '--text': '#C8E8CC',
      '--muted': '#5A8A60',
      '--border': '#243C28',
      '--accent': '#5DCAA5',
      '--accent-text': '#081008',
      '--chip': '#182E1C',
      '--chip-text': '#7AB87E',
      '--input': '#142018',
      '--modal': '#1C3020',
      '--danger': '#E89878',
      '--success': '#9FE1CB',
    },
  },
  espresso: {
    label: 'Еспресо',
    swatch: '#2C1A0E',
    vars: {
      '--bg': '#1A0E06',
      '--header': '#241408',
      '--card': '#2E1C0C',
      '--text': '#F0DEC0',
      '--muted': '#8A6040',
      '--border': '#3C2410',
      '--accent': '#D4956A',
      '--accent-text': '#140800',
      '--chip': '#281808',
      '--chip-text': '#B88050',
      '--input': '#221005',
      '--modal': '#2A1808',
      '--danger': '#E8A088',
      '--success': '#B8D89A',
    },
  },
};

export const DEFAULT_THEME = 'parchment';

export function applyTheme(themeKey) {
  const theme = THEMES[themeKey] || THEMES[DEFAULT_THEME];
  Object.entries(theme.vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}
