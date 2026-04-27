import type { IHtmlFieldSecurityConfig } from '../types/IHtmlFieldSecurityConfig';

/**
 * Builds the `frame-src` CSP source list for a given HTML field security configuration.
 *
 * Each domain in the allow-list expands to both `https://{domain}` and `https://*.{domain}`
 * so that e.g. `youtube.com` covers `https://youtube.com` and `https://www.youtube.com`,
 * matching SharePoint's domain-entry semantics.
 *
 * @param serveUrl The serve URL that is always allowed (e.g. `https://localhost:4321`). Pass an empty string if not applicable.
 * @param security The HTML field security configuration. Defaults to `allowList` with an empty domain list if omitted.
 */
export function buildFrameSrc(
  serveUrl: string,
  security: IHtmlFieldSecurityConfig | undefined,
): string {
  const policy = security?.policy ?? 'allowList';

  if (policy === 'allowAll') {
    return serveUrl ? `${serveUrl} *` : '*';
  }

  if (policy === 'none' || !security?.allowedDomains.length) {
    return serveUrl || "'none'";
  }

  // allowList: expand each domain to bare + wildcard subdomain
  const domainSources = security.allowedDomains
    .flatMap((d) => [`https://${d}`, `https://*.${d}`])
    .join(' ');

  return serveUrl ? `${serveUrl} ${domainSources}` : domainSources;
}
