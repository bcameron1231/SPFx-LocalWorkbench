import type { IHtmlFieldSecurityConfig } from '../types/IHtmlFieldSecurityConfig';

const HOSTNAME_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/;

function normalizeAllowedDomains(allowedDomains: string[] | undefined): string[] {
  if (!allowedDomains?.length) {
    return [];
  }

  const normalizedDomains = allowedDomains
    .map((domain) => domain.trim().toLowerCase())
    .filter((domain) => HOSTNAME_PATTERN.test(domain));

  return [...new Set(normalizedDomains)];
}

/**
 * Builds the `frame-src` CSP source list for a given HTML field security configuration.
 *
 * An optional baseline CSP source expression may be supplied to always allow that source,
 * such as a local dev server origin or `'self'`.
 *
 * Each domain in the allow-list expands to both `https://{domain}` and `https://*.{domain}`
 * so that e.g. `youtube.com` covers `https://youtube.com` and `https://www.youtube.com`,
 * matching SharePoint's domain-entry semantics.
 * Invalid allow-list entries are ignored.
 *
 * @param alwaysAllowedSource CSP source expression that is always allowed (e.g. `https://localhost:4321` or `'self'`). Pass an empty string if not applicable.
 * @param security The HTML field security configuration. Defaults to `allowList` with an empty domain list if omitted.
 */
export function buildFrameSrc(
  alwaysAllowedSource: string,
  security: IHtmlFieldSecurityConfig | undefined,
): string {
  const policy = security?.policy ?? 'allowList';

  if (policy === 'allowAll') {
    return alwaysAllowedSource ? `${alwaysAllowedSource} *` : '*';
  }

  if (policy === 'none' || !security?.allowedDomains.length) {
    return alwaysAllowedSource || "'none'";
  }

  const allowedDomains = normalizeAllowedDomains(security.allowedDomains);

  if (!allowedDomains.length) {
    return alwaysAllowedSource || "'none'";
  }

  // allowList: expand each domain to bare + wildcard subdomain
  const domainSources = allowedDomains.flatMap((d) => [`https://${d}`, `https://*.${d}`]).join(' ');

  return alwaysAllowedSource ? `${alwaysAllowedSource} ${domainSources}` : domainSources;
}
