/**
 * Tenant URLs
 *
 * Decides which requests made inside the webview belong to the configured tenant, so they can be
 * sent through the proxy (where the extension host adds the user's token).
 */

const GRAPH_ORIGIN = 'https://graph.microsoft.com';

/** Origin of the page context site, e.g. https://contoso.sharepoint.com; undefined if not a valid URL */
export function getSiteOrigin(siteUrl: string | undefined): string | undefined {
  try {
    return new URL(siteUrl ?? '').origin;
  } catch {
    return undefined;
  }
}

/**
 * Absolute tenant URL for a reference made in the webview, or undefined when it is not a tenant URL.
 * Server-relative SharePoint paths (/sites/..., /_layouts/...) resolve against the webview address,
 * so they are moved to the site's host.
 */
export function toTenantUrl(
  raw: string,
  siteOrigin: string,
  options: { includeGraph?: boolean } = {},
): string | undefined {
  if (!raw || /^(blob|data):/i.test(raw)) {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(raw, location.href);
  } catch {
    return undefined;
  }
  if (url.origin === siteOrigin || (options.includeGraph && url.origin === GRAPH_ORIGIN)) {
    return url.href;
  }
  // Code may also rebuild the address as https://<webview host>, so compare host names too
  const isWebviewHost = url.origin === location.origin || url.hostname === location.hostname;
  if (isWebviewHost && /^\/(sites|teams|_layouts|_api|_vti_bin)(\/|$)/i.test(url.pathname)) {
    return siteOrigin + url.pathname + url.search;
  }
  return undefined;
}
