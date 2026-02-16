/**
 * Sets up a property on an SPFx component instance with getter/setter
 * @param instance The component instance
 * @param propName Name of the property to define
 * @param getter Function to get the property value
 * @param setter Optional function to set the property value
 */
export function setupProperty(
  instance: any,
  propName: string,
  getter: () => any,
  setter?: (val: any) => void,
): void {
  try {
    const descriptor: PropertyDescriptor = {
      get: getter,
      enumerable: true,
      configurable: true,
    };
    if (setter) {
      descriptor.set = setter;
    }
    Object.defineProperty(instance, propName, descriptor);
  } catch (error: unknown) {
    // Property may already be defined or object sealed, ignore
  }
}
