/**
 * Extracts string value from various property formats
 */
export const getString = (prop: any): string | undefined => {
  if (!prop) return undefined;
  if (typeof prop === 'string') return prop;
  // Handle localized string objects like { default: "Label", ... }
  if (typeof prop === 'object' && prop.default) return prop.default;
  return String(prop);
};
