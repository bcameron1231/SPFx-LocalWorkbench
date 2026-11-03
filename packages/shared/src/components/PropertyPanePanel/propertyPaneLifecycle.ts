// SPFx property pane lifecycle hooks the panel calls on the web part instance, in the order
// SharePoint calls them: loadPropertyPaneResources (once), onPropertyPaneConfigurationStart,
// getPropertyPaneConfiguration, onPropertyPaneRendered, onPropertyPaneConfigurationComplete.

const resourcesLoaded = new WeakMap<object, Promise<void>>();

/**
 * Calls loadPropertyPaneResources() once per web part instance. Web parts often lazy-load their
 * property pane code there, and getPropertyPaneConfiguration() fails until it has resolved.
 */
export function ensurePropertyPaneResources(instance: any): Promise<void> {
  if (!instance || typeof instance.loadPropertyPaneResources !== 'function') {
    return Promise.resolve();
  }

  let loading = resourcesLoaded.get(instance);
  if (!loading) {
    loading = Promise.resolve()
      .then(() => instance.loadPropertyPaneResources())
      .catch((error: unknown) => {
        // Allow a retry on the next open
        resourcesLoaded.delete(instance);
        throw error;
      });
    resourcesLoaded.set(instance, loading);
  }
  return loading;
}

/** Calls an optional lifecycle hook on the instance, logging instead of throwing */
export function callPropertyPaneHook(
  instance: any,
  hook:
    | 'onPropertyPaneConfigurationStart'
    | 'onPropertyPaneRendered'
    | 'onPropertyPaneConfigurationComplete',
  warn: (message: string, error: unknown) => void,
): void {
  if (typeof instance?.[hook] !== 'function') {
    return;
  }
  try {
    instance[hook]();
  } catch (error: unknown) {
    warn(`Error in ${hook}:`, error);
  }
}
