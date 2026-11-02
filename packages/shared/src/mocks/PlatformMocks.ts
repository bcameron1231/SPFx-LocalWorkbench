/**
 * Mocks for SPFx platform modules that web parts import directly:
 * @microsoft/sp-loader, @microsoft/sp-page-context and DigestCache from @microsoft/sp-http.
 */

const loadedScripts: Record<string, Promise<any>> = {};

/**
 * Resolves a URL the way SharePoint would. Server-relative URLs (e.g. /_layouts/15/SP.js)
 * have no host in the workbench, so they are rejected instead of hitting the webview origin.
 */
function resolveExternalUrl(url: string): string | null {
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
    return url;
  }
  return null;
}

export const MockSPComponentLoader = {
  loadCss(url: string): void {
    const resolved = resolveExternalUrl(url);
    if (!resolved) {
      console.warn(`[SPComponentLoader] Skipping server-relative CSS in local workbench: ${url}`);
      return;
    }
    if (document.querySelector(`link[rel="stylesheet"][href="${resolved}"]`)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = resolved;
    document.head.appendChild(link);
  },

  loadScript<T = any>(url: string, options?: { globalExportsName?: string }): Promise<T> {
    // Like SharePoint's loader, scripts are cached per URL. Do not skip a script because its global
    // already exists: JSOM's init.js creates the SP namespace that SP.Runtime.js and SP.js then fill.
    const globalName = options?.globalExportsName;

    const resolved = resolveExternalUrl(url);
    if (!resolved) {
      // SharePoint-hosted script (e.g. JSOM: /_layouts/15/SP.js) has no host in the workbench. Resolve
      // instead of rejecting so web parts that load them up front still initialize; code that later
      // uses the missing global (window.SP) fails at that point.
      console.warn(
        `[SPComponentLoader] SharePoint-hosted script is not available in the local workbench, skipped: ${url}`,
      );
      return Promise.resolve(globalName ? (window as any)[globalName] : undefined);
    }

    if (!loadedScripts[resolved]) {
      loadedScripts[resolved] = new Promise((resolve, reject) => {
        // Hide the workbench AMD define while the script runs, so UMD scripts set their global
        const win = window as any;
        const savedDefine = win.define;
        win.define = undefined;

        const script = document.createElement('script');
        script.src = resolved;
        script.onload = () => {
          win.define = savedDefine;
          resolve(globalName ? win[globalName] : undefined);
        };
        script.onerror = () => {
          win.define = savedDefine;
          delete loadedScripts[resolved];
          reject(new Error(`[SPComponentLoader] Failed to load script: ${resolved}`));
        };
        document.head.appendChild(script);
      });
    }

    return loadedScripts[resolved];
  },

  loadComponentById(): Promise<any> {
    return Promise.reject(
      new Error('[SPComponentLoader] loadComponentById is not supported in the local workbench'),
    );
  },
};

/**
 * Mock of SPPermission. Values mirror the SharePoint SPBasePermissions bits (high, low).
 * The workbench user is treated as a site owner, so hasPermission always returns true.
 */
export class MockSPPermission {
  public static emptyMask = new MockSPPermission({ High: 0, Low: 0 });
  public static viewListItems = new MockSPPermission({ High: 0, Low: 1 });
  public static addListItems = new MockSPPermission({ High: 0, Low: 2 });
  public static editListItems = new MockSPPermission({ High: 0, Low: 4 });
  public static deleteListItems = new MockSPPermission({ High: 0, Low: 8 });
  public static approveItems = new MockSPPermission({ High: 0, Low: 16 });
  public static openItems = new MockSPPermission({ High: 0, Low: 32 });
  public static viewVersions = new MockSPPermission({ High: 0, Low: 64 });
  public static manageLists = new MockSPPermission({ High: 0, Low: 2048 });
  public static viewPages = new MockSPPermission({ High: 0, Low: 131072 });
  public static addAndCustomizePages = new MockSPPermission({ High: 0, Low: 262144 });
  public static manageWeb = new MockSPPermission({ High: 0, Low: 1073741824 });
  public static managePermissions = new MockSPPermission({ High: 0, Low: 33554432 });
  public static fullMask = new MockSPPermission({ High: 2147483647, Low: 4294967295 });

  public readonly value: { High: number; Low: number };

  constructor(value: { High: number; Low: number }) {
    this.value = value;
  }

  public hasPermission(_permission: MockSPPermission): boolean {
    return true;
  }

  public hasAllPermissions(..._permissions: MockSPPermission[]): boolean {
    return true;
  }

  public hasAnyPermissions(..._permissions: MockSPPermission[]): boolean {
    return true;
  }
}

/**
 * Static side of the SPFx ThemeProvider (@microsoft/sp-component-base). Web parts only use
 * ThemeProvider.serviceKey to consume the service; the workbench supplies the service itself.
 */
export class MockThemeProvider {
  public static serviceKey = { id: 'ThemeProvider', name: 'ThemeProvider' };
}

/** Mock of ThemeChangedEventArgs passed to themeChangedEvent handlers */
export class MockThemeChangedEventArgs {
  public theme: any;

  constructor(theme?: any) {
    this.theme = theme;
  }
}

/**
 * Mock of DigestCache. Consumed through serviceScope.consume(DigestCache.serviceKey);
 * returns a fixed digest, since the mock proxy does not validate it.
 */
export class MockDigestCache {
  public static serviceKey = { id: 'DigestCache', name: 'DigestCache' };

  public fetchDigest(_webAbsoluteUrl: string): Promise<string> {
    return Promise.resolve('0x0000000000000000000000000000000000000000,01 Jan 2026 00:00:00 -0000');
  }

  public addDigestToCache(_webAbsoluteUrl: string, _digestValue: string): void {}

  public clearDigest(_webAbsoluteUrl: string): boolean {
    return true;
  }

  public clearAllDigests(): void {}
}
