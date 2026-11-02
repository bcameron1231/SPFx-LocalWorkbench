import { MockThemeChangedEventArgs } from '@spfx-local-workbench/shared';

import type { ISectionDesign } from '../canvas/pageLayout';
import { isDefaultDesign } from '../canvas/sectionTheme';
import type { ThemeProvider } from './ThemeProvider';

type ThemeChangedHandler = (args: MockThemeChangedEventArgs) => void;

/**
 * The ThemeProvider service SPFx web parts get from
 * serviceScope.consume(ThemeProvider.serviceKey): tryGetTheme() and themeChangedEvent.
 * Kept in sync with the workbench theme. Each web part gets its own view of it, so a web part in a
 * section with a background gets that section's theme variant, as on SharePoint.
 */
class SpfxThemeService {
  private provider: ThemeProvider | undefined;
  private handlers: { instanceId: string | undefined; owner: any; handler: ThemeChangedHandler }[] =
    [];
  private designs = new Map<string, ISectionDesign | undefined>();

  public readonly themeChangedEvent = this.createEvent(undefined);

  public tryGetTheme(): any {
    return this.provider?.getTheme();
  }

  /** The service a single web part consumes */
  public forInstance(instanceId: string): { tryGetTheme: () => any; themeChangedEvent: any } {
    return {
      tryGetTheme: () => this.getThemeFor(instanceId),
      themeChangedEvent: this.createEvent(instanceId),
    };
  }

  public getThemeFor(instanceId: string | undefined): any {
    const design = instanceId ? this.designs.get(instanceId) : undefined;
    return isDefaultDesign(design)
      ? this.provider?.getTheme()
      : this.provider?.getSectionTheme(design);
  }

  /** Sets the active workbench theme and notifies subscribed web parts */
  public setProvider(provider: ThemeProvider, notify: boolean): void {
    this.provider = provider;
    if (notify) {
      this.notify(() => true);
    }
  }

  /** Sets the design of the section a web part is in. Returns true when it changed. */
  public setSectionDesign(instanceId: string, design: ISectionDesign | undefined): boolean {
    const normalized = isDefaultDesign(design) ? undefined : design;
    if (JSON.stringify(this.designs.get(instanceId)) === JSON.stringify(normalized)) {
      return false;
    }
    this.designs.set(instanceId, normalized);
    this.notify((id) => id === instanceId);
    return true;
  }

  public forget(instanceId: string): void {
    this.designs.delete(instanceId);
    this.handlers = this.handlers.filter((h) => h.instanceId !== instanceId);
  }

  private createEvent(instanceId: string | undefined) {
    return {
      add: (owner: any, handler: ThemeChangedHandler): void => {
        this.handlers.push({ instanceId, owner, handler });
      },
      remove: (owner: any, handler: ThemeChangedHandler): void => {
        this.handlers = this.handlers.filter((h) => h.owner !== owner || h.handler !== handler);
      },
    };
  }

  private notify(matches: (instanceId: string | undefined) => boolean): void {
    for (const { instanceId, handler } of this.handlers) {
      if (!matches(instanceId)) {
        continue;
      }
      try {
        handler(new MockThemeChangedEventArgs(this.getThemeFor(instanceId)));
      } catch (error: unknown) {
        console.warn('[SpfxThemeService] themeChangedEvent handler failed:', error);
      }
    }
  }
}

export const spfxThemeService = new SpfxThemeService();
