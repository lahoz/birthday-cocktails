export const LIGHT_THEME_COLORS = {
  classic: '#145bff',
  experimental: '#29ffe6',
  light: '#ff0505',
  spiritForward: '#ff1ac2',
} as const

export const DARK_THEME_COLORS = {
  classic: '#013ff9',
  experimental: '#29ffe6',
  light: '#eb7100',
  spiritForward: '#ff1a1a',
} as const

export function getThemeColors(theme?: string) {
  return theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS
}
