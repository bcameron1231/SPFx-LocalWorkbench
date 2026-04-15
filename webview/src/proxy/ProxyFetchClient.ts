/**
 * Proxy Fetch Client
 *
 * Overrides the global window.fetch so that libraries like PnPJS, which use fetch under the covers,
 * get routed through the proxy transport for mock/intercept support.
 *
 * Uses the shared fetch interceptor from @spfx-local-workbench/shared with VsCodeProxyTransport.
 */
import {
  installFetchInterceptor as installSharedInterceptor,
  uninstallFetchInterceptor as uninstallSharedInterceptor,
} from '@spfx-local-workbench/shared';

import { getVsCodeProxyTransport } from './VsCodeProxyTransport';

/**
 * Install the fetch proxy — replaces window.fetch with the proxy version.
 * Call this during workbench initialization when the proxy is enabled.
 */
export function installFetchProxy(): void {
  const transport = getVsCodeProxyTransport();
  installSharedInterceptor(transport);
}

/**
 * Restore the original browser fetch.
 * Call this during cleanup or when the proxy is disabled.
 *
 * NOTE: Currently exported but not used. May be needed for:
 * - Tests that need to reset global state
 * - Dynamic proxy enable/disable scenarios
 * - Hot module reloading in dev environments
 */
export function uninstallFetchProxy(): void {
  uninstallSharedInterceptor();
}
