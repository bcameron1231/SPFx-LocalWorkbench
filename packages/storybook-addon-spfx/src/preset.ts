/**
 * Storybook preset for SPFx addon
 * This file tells Storybook how to load the addon
 */

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, require.resolve('./manager')];
}

export function previewAnnotations(entry: string[] = []): string[] {
  return [...entry, require.resolve('./preview')];
}
