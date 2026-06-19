import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';

// The useColorScheme value is always either light or dark, but the built-in
// type suggests that it can be null. This will not happen in practice, so this
// makes it a bit easier to work with.
type AppColorScheme = Extract<NonNullable<ColorSchemeName>, 'light' | 'dark'>;

export default function useColorScheme(): AppColorScheme {
  const colorScheme = _useColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}
