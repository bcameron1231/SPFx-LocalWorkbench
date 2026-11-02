import { MockThemeChangedEventArgs } from '@spfx-local-workbench/shared';

import type { ThemeProvider } from './ThemeProvider';

type ThemeChangedHandler = (args: MockThemeChangedEventArgs) => void;

/**
 * The ThemeProvider service SPFx web parts get from
 * serviceScope.consume(ThemeProvider.serviceKey): tryGetTheme() and themeChangedEvent.
 * Kept in sync with the workbench theme picker.
 */
class SpfxThemeService {
  private provider: ThemeProvider | undefined;
  private handlers: { owner: any; handler: ThemeChangedHandler }[] = [];

  public readonly themeChangedEvent = {
    add: (owner: any, handler: ThemeChangedHandler): void => {
      this.handlers.push({ owner, handler });
    },
    remove: (owner: any, handler: ThemeChangedHandler): void => {
      this.handlers = this.handlers.filter((h) => h.owner !== owner || h.handler !== handler);
    },
  };

  public tryGetTheme(): any {
    return this.provider?.getTheme();
  }

  /** Sets the active workbench theme and, when notify is set, tells subscribed web parts */
  public setProvider(provider: ThemeProvider, notify: boolean): void {
    this.provider = provider;
    if (!notify) {
      return;
    }
    for (const { handler } of this.handlers) {
      try {
        handler(new MockThemeChangedEventArgs(provider.getTheme()));
      } catch (error: unknown) {
        console.warn('[SpfxThemeService] themeChangedEvent handler failed:', error);
      }
    }
  }
}

export const spfxThemeService = new SpfxThemeService();
